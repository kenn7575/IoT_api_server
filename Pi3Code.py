import os
import time
import math
import datetime
from urllib import request
import requests
import json
from grovepi import *
from grove_rgb_lcd import *

soundSensor = 0;
led = 4;
button = 3;
dht_sensor_port = 7;

tempInCelsius = True;
lastTimeDisplayUpdatedForTemp = datetime.datetime.now();
lastTimeDisplayUpdatedForHum = datetime.datetime.now();
lastTimeSettingsUpdated = datetime.datetime.now();
lastTimeSoundWasMeasured = datetime.datetime.now();
settingsRefreshSeconds = 360;
tempRefreshSeconds = 20;
humidityRefreshSeconds = 20;
activeSensorSettings = "";
startHour = datetime.datetime.now();
endHour = datetime.datetime.now();

tempMin = 0;
tempMax = 0;
tempAlert = False;

humMin = 0;
humMax = 0;
humAlert = False;

temperatur = "";
humidity = "";
machineId = "";
apikey = "";

soundlist = [];

pinMode(led, "OUTPUT");
pinMode(button, "INPUT");

def setSensorSettings(activePeriod, sensorSettings):
    global tempMax;
    global tempMin;
    global tempRefreshSeconds;
    global humMax;
    global humMin;
    global humidityRefreshSeconds;
    global activeSensorSettings;

    for sensor in sensorSettings:

        if(sensor["activePeriod"] != activePeriod):
            print("skipped");
            continue;

        activeSensorSettings = sensor["activePeriod"];

        if(sensor["sensorType"] == "Temperature"):
            tempMax = sensor["maxValue"];
            tempMin = sensor["minValue"];
            tempRefreshSeconds = sensor["timeIntervalSeconds"];

        elif(sensor["sensorType"] == "Humidity"):
            humMax = sensor["maxValue"];
            humMin = sensor["minValue"];
            humidityRefreshSeconds = sensor["timeIntervalSeconds"];

def loadSettings():
    answar = requests.get(f"http://192.168.1.50:3000/devices/{machineId}/settings", headers = {"api-key": apikey});
    jsos = answar.json();
    
    settings = jsos["settings"];

    global startHour;
    global endHour;
    global settingsRefreshSeconds;

    settingsRefreshSeconds = settings["updateSettingsIntervalSeconds"];
    sh = datetime.datetime.strptime(settings["startTime"], "%H:%M:%S");
    eh = datetime.datetime.strptime(settings["endTime"], "%H:%M:%S");

    startHour = datetime.timedelta(hours = sh.hour, minutes = sh.minute, seconds = sh.second);
    endHour = datetime.timedelta(hours = eh.hour, minutes = eh.minute, seconds = eh.second);

    datenow = datetime.datetime.now();
    timenow = datetime.timedelta(hours = datenow.hour, minutes = datenow.minute, seconds = datenow.second);

    if(timenow > startHour and timenow < endHour):
        setSensorSettings(activePeriod = "Open", sensorSettings = jsos["sensorSettings"]);
    else:
        setSensorSettings(activePeriod = "Closed", sensorSettings = jsos["sensorSettings"]);

while True:
    try:
        digitalWrite(led, 0);
        setRGB(0,0,255);
        setText("Booting up");

        if(os.path.exists("/etc/machine-id")):
            file = open("/etc/machine-id");
            machineId = file.read();

        if(os.path.exists("/var/lib/dbus/machine-id") and machineId == ""):
            file = open("/var/lib/dbus/machine-id");
            machineId = file.read();

        if(machineId == ""):
            setRGB(255,0,0);
            setText("Error plase reboot");
            continue;

        saw = requests.post(f"http://192.168.1.50:3000/devices/login", json = {"machine_id": machineId})
        apikeyjson = json.loads(saw.text);
        apikey = apikeyjson["apiKey"];

        setText("Loading settings");

        loadSettings();

        if(tempMax == 0 and humMax == 0):
            setText("Failed to get settings");
            setRGB(255,0,0);
            print("failed to get sensor settings")
            continue;

        setText("Waiting for the first measurement");

    except Exception as ex:
        print(ex);
        digitalWrite(led, 1);
        setRGB(255,0,0);
        setText("Error while booting up");
        print("Error");
        continue;

    while True:
        try:
            timeatm = datetime.datetime.now();

            buttonInput = digitalRead(button);
            if (buttonInput):
                if(tempInCelsius is True):
                    tempInCelsius = False;
                    tempAsFloat = float(temperatur);
                    fehrenheit = (tempAsFloat * float(1.8)) + float(32);
                    setText(f"Temp: {fehrenheit:.2f}" + "F    " + "Humidity :" + humidity + "%");
                else:
                    tempInCelsius = True;
                    setText("Temp:" + temperatur + "C      " + "Humidity :" + humidity + "%");


            if(timeatm - lastTimeSettingsUpdated > datetime.timedelta(seconds = settingsRefreshSeconds)):
                loadSettings();
                lastTimeSettingsUpdated = timeatm;

            soundMeasured = analogRead(soundSensor);
            if(soundMeasured > 0):
                soundlist.append(soundMeasured);
                if(timeatm - lastTimeSoundWasMeasured > datetime.timedelta(minutes=1)):
                    soundOverTime = 0;
                    for so in soundlist:
                        soundOverTime += so;
                    soundLevel = soundOverTime / len(soundlist);
                    if(soundLevel > 300):
                        #send measurement
                        url = "http://192.168.1.50:3000/measurements/noise";
                        obj = {"measurement": soundLevel, "valueType": "Noise", "machine_id": machineId};
                    
                        helpp = requests.post(url, json = obj, headers = {"api-key": apikey});
                        
                        measurementjson = json.loads(helpp.text);
                        measurementId = measurementjson["id"];
                        
                        #send alert
                        url = "http://192.168.1.50:3000/alerts";
                        obj = {"sensorType": "Noise", "name": "Too much noise alert", "description": f"There are too loud noise in this office envarioment", "measurementId": measurementId};
                    
                        alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});
                    
                    elif(soundLevel > 50 and activeSensorSettings == "Closed"):
                        #send measurement
                        url = "http://192.168.1.50:3000/measurements/noise";
                        obj = {"measurement": soundLevel, "valueType": "Noise", "machine_id": machineId};
                    
                        helpp = requests.post(url, json = obj, headers = {"api-key": apikey});
                        
                        measurementjson = json.loads(helpp.text);
                        measurementId = measurementjson["id"];
                        #send alert
                        url = "http://192.168.1.50:3000/alerts";
                        obj = {"sensorType": "Noise", "name": "Noise out of office opening hours", "description": f"There are sound in the closed office hours", "measurementId": measurementId};
                    
                        alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});
                        digitalWrite(led, 1);

                    soundlist.clear();
                    lastTimeSoundWasMeasured = timeatm;

            [ temp,hum ] = dht(dht_sensor_port, 1);

            if(math.isnan(temp)):
                continue;

            t = str(temp);
            h = str(hum);

            if(timeatm - lastTimeDisplayUpdatedForTemp > datetime.timedelta(seconds = tempRefreshSeconds)):
                temperatur = t;

                url = "http://192.168.1.50:3000/measurements/temperature";
                obj = {"measurement": temperatur, "valueType": "C", "machine_id": machineId};

                helpp = requests.post(url, json = obj, headers = {"api-key": apikey});

                lastTimeDisplayUpdatedForTemp = timeatm;

                measurementjson = json.loads(helpp.text);
                measurementId = measurementjson["id"];

                if(temp > tempMax):
                    #Too hot
                    url = "http://192.168.1.50:3000/alerts";
                    obj = {"sensorType": "Temperature", "name": "Temperature is too high alert", "description": f"The temperature rose to over {tempMax} celsius", "measurementId": measurementId};

                    alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});

                    setRGB(255,0,0);
                    tempAlert = True;
                elif(temp < tempMin):
                    #Too cold
                    url = "http://192.168.1.50:3000/alerts";
                    obj = {"sensorType": "Temperature", "name": "Temperature is too low alert", "description": f"The temperature went under {tempMin} celsius", "measurementId": measurementId};

                    alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});
                    setRGB(0,0,255);
                    tempAlert = True;
                else:
                    if(humAlert is False):
                        setRGB(0,255,0);

                    if(tempAlert is True):
                        url = "http://192.168.1.50:3000/alerts";
                        obj = {"sensorType": "Temperature", "name": "Temperature is back to normale", "description": f"The Temperature is back in between {tempMin}C and {tempMax}C", "measurementId": measurementId};

                        alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});

                    tempAlert = False;

                

                if(tempInCelsius is False):
                    tempAsFloat = float(temperatur);
                    fehrenheit = (tempAsFloat * float(1.8)) + float(32);
                    setText(f"Temp: {fehrenheit:.2f}" + "F     " + "Humidity :" + humidity + "%");
                else:
                    setText("Temp:" + temperatur + "C      " + "Humidity :" + humidity + "%");

                   

            if(timeatm - lastTimeDisplayUpdatedForHum > datetime.timedelta(seconds = humidityRefreshSeconds)):

                humidity = h;
                url = "http://192.168.1.50:3000/measurements/humidity";
                obj = {"measurement": humidity, "valueType": "%", "machine_id": machineId};

                helpp = requests.post(url, json = obj, headers = {"api-key": apikey});
                lastTimeDisplayUpdatedForHum = timeatm;

                measurementjson = json.loads(helpp.text);
                measurementId = measurementjson["id"];

                if(hum > humMax):
                    #Too hot
                    url = "http://192.168.1.50:3000/alerts";
                    obj = {"sensorType": "Humidity", "name": "Humidity is too high alert", "description": f"The humidity rose over {humMax} %", "measurementId": measurementId};

                    alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});

                    setRGB(255,0,0);
                    humAlert = True;
                elif(hum < humMin):
                    #Too cold
                    url = "http://192.168.1.50:3000/alerts";
                    obj = {"sensorType": "Humidity", "name": "Humidity is too low alert", "description": f"The humidity went under {humMin} %", "measurementId": measurementId};

                    alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});

                    setRGB(0,0,255);
                    humAlert = True;
                else:
                    if(tempAlert is False):
                        setRGB(0,255,0);

                    if(humAlert is True):
                        url = "http://192.168.1.50:3000/alerts";
                        obj = {"sensorType": "Humidity", "name": "Humidity is back to normale", "description": f"The humidity is back in between {humMin}% and {humMax}%", "measurementId": measurementId};

                        alertsend = requests.post(url, json = obj, headers = {"api-key": apikey});

                    humAlert = False;

                

                if(tempInCelsius is False):
                    tempAsFloat = float(temperatur);
                    fehrenheit = (tempAsFloat * float(1.8)) + float(32);
                    setText(f"Temp: {fehrenheit:.2f}" + "F    " + "Humidity :" + humidity + "%");
                else:
                    setText("Temp:" + temperatur + "C      " + "Humidity :" + humidity + "%");

            

        except Exception as i:
            print(i);
            digitalWrite(led, 1);
            setRGB(255,0,0);
            setText("Error");
            ("Error");
            break;
