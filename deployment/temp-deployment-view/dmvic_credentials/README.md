DMVIC Credentials

This folder holds local UAT credentials used by the DMVIC integration during development.

Files:
- PatabimaAgencyUAT.pfx: UAT client certificate (used if pyOpenSSL is installed)
- Password.txt: passphrase for the PFX file (read automatically if DMVIC_PASSPHRASE is not set)

Environment variables (set in backend/.env):
- DMVIC_BASE_URL=https://uat.dmvic.com
- DMVIC_USERNAME=your-username
- DMVIC_PASSWORD=your-password
- DMVIC_CLIENT_ID=your-client-id
- DMVIC_PFX_PATH=dmvic_credentials
- DMVIC_PASSPHRASE=optional (if omitted, read from Password.txt)

Notes:
- If pyOpenSSL is missing, the integration will still attempt token-based endpoints; certificate-based calls may be limited.