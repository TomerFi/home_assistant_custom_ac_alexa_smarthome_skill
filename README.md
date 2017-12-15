# I'M WORKING ON IT...


# home_assistant_custom_ac_alexa_smarthome_skill
Alexa smart home skill hosted on lambda servers for controlling a custom ir air conditioner build with Home Assistant controls.
I want to tell you a little bit about the why I decided to create this skill I actually waited a long time before I could find the time to work on this project, and it's actually my first alexa smart home skill, I've made a couple of custom skills, but this if my first smart home skill... so forgive me if I seem a bit too excited. ;-)</br>
You can check out the skill in action [here](https://www.youtube.com/edit?o=U&video_id=Y4i989zwQlc).


## Background
So... I have a couple of IR controlled air-conditioner units that I wanted to make smarter. </br>
The first part was easy, I purchased a [*Broadlink RM Pro*](https://www.aliexpress.com/item/Broadlink-RM2-RM-Pro-Smart-home-Automation-Universal-Intelligent-wireless-remote-control-WIFI-IR-RF-switch/32738344424.html?spm=a2g0s.9042311.0.0.svn7ka) for my living room's ac unit, and a [*Broadlink RM Mini*](https://www.aliexpress.com/item/Broadlink-RM2-RM-PRO-Smart-Home-Automation-WiFi-IR-RF-Universal-Intelligent-Wireless-remote-Controller-for/32729931353.html?spm=a2g0s.9042311.0.0.svn7ka) for my bedroom ac.</br>
These devices are actually a smarter universal remote that you can access remotely a create different scenarios for using your various ir/rf devices (only the pro version supports rf), I've been using them for more than a year now and they work great!</br>
For this project I've used my broadlink devices as IR Transmitters. The ir codes management will be handled by home assistant and activated with alexa.

## Get The IR Codes
So, the first thing I did was getting the ir codes, it's important to remember in regards to the basic AC Unites that has a remote with a screen showing all the ac data, the ir codes that will be sent to the unit will contain all the needed information in one code packet. </br>
For example, let's say that my remote displays mode:HEAT, fan:LOW low and Temperature:26C, when I'll press the ON button, the remote will send a code packet constructed from "HEAT+LOW+26".</br>
Now, if I press the + button to increase the temperature after I've turned on the unit, the remote will send a code constructed from "HEAT+LOW+27". </br>
If I then change the mode to COOL, assuming my remote remembers my unit is on, it will send a code packet constructed from "COOL+LOW+27". </br>
If I press the OFF button on my remote, it will just send "OFF" to the unit, and if my remote remembers that the unit if off, any change I'll make to the temperature, mode, fan or any other setting, will not be sent to the unit, it will only be displayed and saved in the remote waiting for when I'll press the ON button. </br>

My living room's ac unit (which is the one I'll be using in this example) settings has the following abilities:
- Select mode: COOL/HEAT.
- Select FAN: LOW/MED/HIGH/AUTO
- Select temperature: 17-32 Celsius.

Let's do the math together, 2 modes X 4 fan levels X 16 possible temperatures + 1 off command = 129 code packets I needed to learn in order to be able to control my ac unit. </br>

There are a couple of ways you can obtain your code packets, </br>
- You can teach the code packets to your broadlink which is pretty easy, after your done you can extract the code packets from the broadlink settings using NightRang3r's [scripts](https://github.com/NightRang3r/Broadlink-e-control-db-dump), it's pretty straight forward. Please note the script is designed for use with python 2.7, so if you are using python 3 and above, you're going to need to make some adjustments to the script. Also, please note you're going to need an android device to extract these settings from.
- You can extract the code packets using the *learn_command* service from the *brodlink* platform in *home assistant* as described [here](https://home-assistant.io/components/switch.broadlink/#how-to-obtain-irrf-packets). Please note that this method might take a little longer, but it doesn't require and programing knowledge or android device. </br>
In my case, I had all the code packets already in my broadlink app, so it didn't make much sense using the learn_command service, I ended up using a modified version of NightRang3r scripts I found online. </br>

Once you have all your code packets ready, you can jump to the fun stuff... configuring home assistant. :-)

## Home Assistant Stuff
Let's breakdown our ac unit controllers to home assistant entities...</br>
### Fan Control
The first control we'll create is the Fan controller, which is basically an *input_select* entity:</br>
```yaml
lr_ac_fan:
  name: lr_ac_fan
  options:
    - LOW
    - MED
    - HIGH
    - AUTO
```
### Mode Control
The second control we'll create is the Mode controller, which is also going to be an *input_select* entity:</br>
```yaml
lr_ac_state:
  name: lr_ac_state
  options:
    - COOL
    - HEAT
```
### Temperature Control
The third controll we'll create is the Temperature controller, we're going to use an *input_text* entity for this one:</br>
```yaml
lr_ac_temp_text:
  name: lr_ac_temp_text
```
## Alexa Stuff
