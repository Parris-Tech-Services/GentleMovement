#!/usr/bin/env python3
"""Bounded, resumable repair agent. Requires OPENAI_API_KEY and GitHub Actions token.
Runs tests in an isolated checkout; only proposes PRs, never pushes production."""
import os,json,subprocess,urllib.request,urllib.error,base64,datetime,pathlib,re,sys
ROOT=pathlib.Path.cwd(); API="https://api.github.com"; REPO=os.environ["GITHUB_REPOSITORY"]
TOKEN=os.environ["GH_TOKEN"]; KEY=os.environ.get("OPENAI_API_KEY","")
def api(method,path,data=None):
    req=urllib.request.Request(API+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={"Authorization":"Bearer "+TOKEN,"Accept":"application/vnd.github+json","X-GitHub-Api-Version":"2022-11-28","Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=30) as r:return json.load(r)
def run(cmd,timeout=240):
    try:
        p=subprocess.run(cmd,capture_output=True,text=True,timeout=timeout)
        return p.returncode,(p.stdout+"\n"+p.stderr)[-14000:]
    except Exception as e:return 124,str(e)
def model(messages):
    req=urllib.request.Request("https://api.openai.com/v1/chat/completions",data=json.dumps({"model":os.environ.get("REPAIR_MODEL","gpt-4.1"),"messages":messages,"temperature":0.1}).encode(),headers={"Authorization":"Bearer "+KEY,"Content-Type":"application/json"})
    with urllib.request.urlopen(req,timeout=90) as r:return json.load(r)["choices"][0]["message"]["content"]
def issue(body):
    try:return api("POST",f"/repos/{REPO}/issues",{"title":"Automated completion check: unresolved verification","body":body})["html_url"]
    except Exception as e:print("Issue creation failed:",e);return ""
def main():
    ledger=json.loads((ROOT/"completion/objectives.json").read_text())
    pending=[o for o in ledger["objectives"] if o["status"]!="complete"]
    if not pending:print("No pending objectives");return
    code,output=run(["npm","test"])
    report=f"Run: {datetime.datetime.now(datetime.timezone.utc).isoformat()}\nRepository: {REPO}\nPending: {', '.join(o['id'] for o in pending)}\nTests: {code}\n\n{output}"
    pathlib.Path("completion/last-run.txt").write_text(report)
    if code==0:
        print("Tests passed. Outstanding acceptance criteria still require separate evidence; no completion claim.")
        return
    if not KEY:
        print("BLOCKED: OPENAI_API_KEY secret not configured; cannot autonomously propose code changes.")
        print("Tests failed:",output[-1500:]);sys.exit(2)
    # Restrict modifications to tracked source files and a single safe edit per iteration.
    status,_=run(["git","status","--porcelain"])
    if status:print("Checkout dirty; refusing automated edit");sys.exit(2)
    branch="agent/completion-"+datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d-%H%M%S")
    run(["git","checkout","-b",branch])
    for attempt in range(3):
        inventory=run(["git","ls-files"])[1]
        response=model([{"role":"system","content":"You are a careful software repair agent. Return ONLY JSON: {path: existing relative tracked source file, content: complete UTF-8 replacement file}. One file per iteration. Never edit secrets, workflows, dependency lockfiles, binaries, tests, completion ledger, or security configuration. Preserve behavior; fix the supplied failing test. If no safe fix, return {}."},{"role":"user","content":f"Repository tracked files:\n{inventory[-12000:]}\nTest output:\n{output}\nReturn one safe complete file replacement or {{}}."}])
        try:patch=json.loads(response)
        except Exception:break
        path=patch.get("path");content=patch.get("content")
        if not isinstance(path,str) or not isinstance(content,str):break
        allowed={p for p in inventory.splitlines() if p.endswith((".js",".mjs",".ts",".tsx",".jsx",".css",".html")) and not p.startswith((".github/","completion/","tests/")) and ".test." not in p and ".spec." not in p}
        if path not in allowed or len(content)>200000:break
        file=ROOT/path
        # Provide actual source content in second request; never let model fabricate the original.
        response=model([{"role":"system","content":"Return only JSON with keys path and content. Fix the failing test by minimally editing the provided source. Preserve unrelated logic. Never add network calls, secret handling, shell commands or eval."},{"role":"user","content":f"File: {path}\nOriginal:\n{file.read_text()[:120000]}\nFailure:\n{output[-12000:]}"}])
        try:patch=json.loads(response)
        except Exception:break
        if patch.get("path")!=path or not isinstance(patch.get("content"),str):break
        original=file.read_text();file.write_text(patch["content"])
        code,output=run(["npm","test"])
        if code==0:
            run(["git","add","--",path])
            c,log=run(["git","commit","-m",f"Agent: repair failing tests for {pending[0]['id']}"])
            if c:print(log);sys.exit(2)
            # Push only an isolated branch and create a PR requiring human review.
            p,log=run(["git","push","origin",branch])
            if p:print(log);sys.exit(2)
            pr=api("POST",f"/repos/{REPO}/pulls",{"title":f"Automated repair proposal: {pending[0]['id']}","head":branch,"base":os.environ.get("DEFAULT_BRANCH","main"),"body":"Automated repair proposal. Tests passed locally in Actions. Human review and production verification required. This PR does NOT close the completion objective."})
            print("Created review PR:",pr["html_url"]);return
        file.write_text(original)
    print("No safe passing repair found; leaving objective open.")
    sys.exit(1)
if __name__=="__main__":main()
