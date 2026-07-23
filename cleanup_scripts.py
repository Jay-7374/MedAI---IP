import os

backend_files_to_delete = [
    'test_phase_6a.py',
    'test_phase_6b.py',
    'test_security.py',
    'run_gk_tests.py',
    'test_streaming.py',
    'test_fallback.py',
    'test_fallback_mock.py',
    'test_fallback_mock_both_fail.py',
    'test_fallback_mock_midstream.py',
    'test_generator.py',
    'test_json.py',
    'test_elevenlabs.py',
    'verify_roles.py',
    'fix_403.py',
    'fix_app_jsx.py',
    'fix_conftest.py',
    'fix_frontend.py',
    'fix_tests.py',
    'fix_tests2.py',
    'move_lifespan.py',
    'refactor_chatbot.py',
    'append_walkthrough.py',
    'check_documents.py',
    'check_indexes.py',
    'chatbot_copy.py',
    '500_error.txt',
    'FORCE_FAIL.txt',
    'call.ps1'
]

deleted_files = []

for f in backend_files_to_delete:
    path = os.path.join('backend', f)
    if os.path.exists(path):
        os.remove(path)
        deleted_files.append(path)

frontend_files_to_delete = [
    'test-streaming.cjs'
]

for f in frontend_files_to_delete:
    path = os.path.join('frontend', f)
    if os.path.exists(path):
        os.remove(path)
        deleted_files.append(path)

print("Deleted files:", deleted_files)
