# Django Server Setup for React Native Testing

## Start Django Server for React Native Access

To allow React Native to connect to Django, start the server with:

```bash
cd "C:\Users\USER\Desktop\PATABIMA\PATABIMA FRONT\PATA BIMA AGENCY - Copy\insurance-app"
python manage.py runserver 0.0.0.0:8000
```

Or specifically on your IP:

```bash
python manage.py runserver 192.168.0.102:8000
```

## Network Configuration

- **Computer IP**: 192.168.0.102
- **Django Server**: http://192.168.0.102:8000
- **React Native API Base**: http://192.168.0.102:8000

## Testing Steps

1. **Start Django server** with network access
2. **Open React Native app** 
3. **Look for car icon** (🚗) on home screen
4. **Tap to open TOR test form**
5. **Fill in form data** and hit "Test Django Connection"

## Test Features Added

✅ **Network Fix**: Updated API URLs to use computer's IP address instead of localhost
✅ **DMVIC Check**: Simulates vehicle insurance status checking
✅ **Document Upload**: Simulates OCR document processing  
✅ **Premium Calculation**: Full pricing with underwriters, levies, and commissions
✅ **Real Django Integration**: Tests actual Django endpoints
✅ **Comprehensive Results**: Step-by-step test feedback

## Expected Test Results

- ✅ Django server connection
- ✅ Authentication with OTP
- ⚠️ DMVIC vehicle check (simulation)
- ✅ Document upload simulation
- ✅ Premium calculation with underwriters
- ✅ Django form submission
- ✅ Django premium calculation

The test will show if any specific part fails and provide troubleshooting tips.