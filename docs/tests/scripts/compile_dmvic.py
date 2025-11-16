import py_compile
try:
    py_compile.compile('insurance-app/app/services/dmvic_service.py', doraise=True)
    print('py_compile: OK')
except Exception as e:
    import traceback
    traceback.print_exc()
