$env:Path += ";C:\Users\USER\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\Scripts"

# Initialize EB with responses
@"
n
y
1
"@ | eb init --region us-east-1 patabima-insurance-backend
