import unittest, os, importlib.util, pathlib, tempfile, subprocess
os.environ.setdefault("GITHUB_REPOSITORY","example/repo")
os.environ.setdefault("GH_TOKEN","fake-test-token")
spec=importlib.util.spec_from_file_location("repair",pathlib.Path(__file__).with_name("autonomous-repair.py"))
repair=importlib.util.module_from_spec(spec)
spec.loader.exec_module(repair)
class RunnerTests(unittest.TestCase):
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
