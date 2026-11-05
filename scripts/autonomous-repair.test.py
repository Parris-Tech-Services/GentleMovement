import unittest, os, importlib.util, pathlib, tempfile, subprocess
import json
from unittest.mock import patch
os.environ.setdefault("GITHUB_REPOSITORY","example/repo")
os.environ.setdefault("GH_TOKEN","fake-test-token")
spec=importlib.util.spec_from_file_location("repair",pathlib.Path(__file__).with_name("autonomous-repair.py"))
repair=importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)
class RunnerTests(unittest.TestCase):
    def test_green_tests_with_open_acceptance_are_nonzero_and_persisted(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);(root/'completion').mkdir()
            (root/'completion/objectives.json').write_text(json.dumps({'objectives':[{'id':'GM-AUDIO-001','status':'open','acceptance':[{'id':'production','verified':False,'evidence':[]}]}]}))
            def run(cmd,**kwargs):
                if cmd[0]=='node':
                    (root/'completion/report.json').write_text(json.dumps({'complete':False,'objectives':[{'id':'GM-AUDIO-001','status':'open','criteria':[{'id':'production','errors':['missing deployment']}]}]}))
                    return 1,'Deployment remains incomplete'
                return 0,'Unit tests passed'
            previous=pathlib.Path.cwd()
            try:
                os.chdir(root)
                with patch.object(repair,'ROOT',root),patch.object(repair,'run',side_effect=run),patch.object(repair,'issue') as issue,patch.dict(os.environ,{'GITHUB_EVENT_NAME':'workflow_dispatch'}):
                    with self.assertRaises(SystemExit) as result:repair.main()
                    self.assertEqual(result.exception.code,1)
                    self.assertIn('missing deployment',issue.call_args.args[0])
                    self.assertIn('Deployment remains incomplete',(root/'completion/last-run.txt').read_text())
            finally:os.chdir(previous)
    def test_false_complete_status_is_still_inspected(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);(root/'completion').mkdir()
            (root/'completion/objectives.json').write_text(json.dumps({'objectives':[{'id':'GM-AUDIO-001','status':'complete'}]}))
            def run(cmd,**kwargs):
                (root/'completion/report.json').write_text(json.dumps({'complete':False,'objectives':[{'id':'GM-AUDIO-001','status':'open','criteria':[]}]}))
                return 1,'Unsupported completion'
            with patch.object(repair,'ROOT',root),patch.object(repair,'run',side_effect=run),patch.object(repair,'KEY',''):
                with self.assertRaises(SystemExit) as result:repair.main()
                self.assertEqual(result.exception.code,2)
    def test_crashed_gate_cannot_reuse_old_success_report(self):
        with tempfile.TemporaryDirectory() as temp:
            root=pathlib.Path(temp);(root/'completion').mkdir()
            (root/'completion/objectives.json').write_text(json.dumps({'objectives':[]}))
            (root/'completion/report.json').write_text(json.dumps({'complete':True,'objectives':[]}))
            with patch.object(repair,'ROOT',root),patch.object(repair,'run',return_value=(1,'gate crashed')):
                with self.assertRaises(SystemExit) as result:repair.main()
                self.assertEqual(result.exception.code,2)
    def test_subprocess_does_not_inherit_secrets(self):
        original={key:os.environ.get(key) for key in ("OPENAI_API_KEY","GH_TOKEN","GITHUB_TOKEN","ACTIONS_RUNTIME_TOKEN")}
        try:
            for key in original:os.environ[key]="must-not-leak"
            code,output=repair.run(["python3","-c","import os; print('|'.join(os.getenv(k,'NONE') for k in ('OPENAI_API_KEY','GH_TOKEN','GITHUB_TOKEN','ACTIONS_RUNTIME_TOKEN')))"])
            self.assertEqual(code,0)
            self.assertIn("NONE|NONE|NONE|NONE",output)
            self.assertNotIn("must-not-leak",output)
        finally:
            for key,value in original.items():
                if value is None:os.environ.pop(key,None)
                else:os.environ[key]=value
    def test_runner_has_bounded_attempts(self):
        source=pathlib.Path(repair.__file__).read_text()
        self.assertIn("for attempt in range(3)",source)
    def test_repair_only_opens_review_pr(self):
        source=pathlib.Path(repair.__file__).read_text()
        self.assertIn('api("POST",f"/repos/{REPO}/pulls"',source)
        self.assertNotIn('"/merges"',source)
if __name__=="__main__":unittest.main()

