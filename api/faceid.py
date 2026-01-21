
from flask import Flask, request
import requests
import xml.etree.ElementTree as ET

app = Flask(__name__)

BOT_TOKEN = '8341944003:AAF_Q_-t5347BNi3aYgACYtB3BteAixHp34'
CHAT_ID = '1232455326'

@app.route('/FaceID', methods=['POST'])
def faceid_listener():
    try:
        xml_data = request.data.decode('utf-8')
        root = ET.fromstring(xml_data)

        employee_id = "Noma'lum"
        for elem in root.iter():
            if 'employeeNo' in elem.tag:
                employee_id = elem.text

        msg = f"🔔 Kattabaza FaceID: {employee_id} keldi."
        
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        requests.post(url, json={"chat_id": CHAT_ID, "text": msg})
        
        return "OK", 200
    except Exception as e:
        return str(e), 400