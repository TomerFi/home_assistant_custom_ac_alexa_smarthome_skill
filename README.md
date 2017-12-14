# I'M WORKING ON IT...


# home_assistant_custom_ac_alexa_smarthome_skill
Alexa smart home skill hosted on lambda servers for controlling a custom ir air conditioner build with Home Assistant controls.
I want to tell you a little bit about the why I decided to create this skill I actually waited along time before I could find the time to work on this project, and it's actually my first alexa smart home skill, I've made a couple of custom skills, but this if my first smart home skill... so forgive me if I seem a bit too excited. ;-)</br>
You can check out the skill in action [here](https://www.youtube.com/edit?o=U&video_id=Y4i989zwQlc).


## Background
So... I have a couple of IR controlled air-conditioner units that I wanted to make smarter.</br>
The first part was easy, I purchased a [*Broadlink RM Pro*](https://www.aliexpress.com/item/Broadlink-RM2-RM-Pro-Smart-home-Automation-Universal-Intelligent-wireless-remote-control-WIFI-IR-RF-switch/32738344424.html?spm=a2g0s.9042311.0.0.svn7ka) for my living room's ac unit, and a [*Broadlink RM Mini*](https://www.aliexpress.com/item/Broadlink-RM2-RM-PRO-Smart-Home-Automation-WiFi-IR-RF-Universal-Intelligent-Wireless-remote-Controller-for/32729931353.html?spm=a2g0s.9042311.0.0.svn7ka) for my bedroom ac.</br>
These devices are actually a smarter universal remote that you can access remotely a create different scenarios for using your various ir/rf devices (only the pro version supports rf), I've been using them for more then a year now and they work great!</br>
For this project I've used my broadlink devices as IR Transmitters. The ir codes management will be handled by home assistant and activated with alexa.

## Get The IR Codes
So, the first thing I did was getting the ir codes, it's important to remember in regards to the basic AC Unites that has a remote with a screen showing all the ac data, the ir codes that will be sent to the unit will contain all the needed information in one code packet.</br>
For example, lets say the my remote display mode:HEAT, fan:LOW low and  Temperature:26C, when I'll press the ON button, the remote will send a code packet constructed from "HEAT+LOW+26".</br>
Now, if I press the + button to increase the temperature after I've turned on the unit, the remote will send a code constructed from "HEAT+LOW+27".</br>
If I then press change the mode to COOL, assuming my remote remembers my unit is on, it will send a code packet constructed from "COOL+LOW+27".</br>
If I press the OFF button on my remote, it will just send "OFF" to the unit, and if my remote remembers that the unit if off, any change I'll make to the temperature, mode, fan or any other setting, will not be sent to the unit, it will only be displayed and saved in the remote waiting for when I'll the ON button.</br>

Now, my living room's ac unit (which is the one I'll be using in this example) settings has the following abilities:
- Select mode: COOL/HEAT.
- Select FAN: LOW/MED/HIGH/AUTO
- Select temperature: 17-32 Celsius.

Lets do the math together, 2 modes X 4 fan levels X 16 possible temperatures + 1 off command = 129 code packets I needed to learn in order to be able to control my ac unit.</br>

There are a couple of ways you can obtain you code packets,


## Home Assistant Stuff


## Alexa Stuff
