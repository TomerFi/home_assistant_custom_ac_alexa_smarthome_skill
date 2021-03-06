# Alexa Smart Skill for controlling IR AC Units using Home Assistant and Broadlink</br>![Maintenance](https://img.shields.io/maintenance/no/2019.svg)

**NOT MAINTAINED!**

I'm no longer maintaining this repository!</br>
That doesn't mean I don't use it, It just means this repository will not be maintained.

There are better solutions for this, you can find it [my home assistant configuration](https://github.com/TomerFi/my_home_assistant_configuration) and [my appdaemon configuration](https://github.com/TomerFi/my_appdaemon_configuration).

You can still use the files :point_up:, if you want.</br>
These :point_down: are the instructions.

__________________________________________

Alexa smart home skill hosted on lambda servers for controlling a custom ir air conditioner build with [Home Assistant](https://home-assistant.io/) controls.</br>
You can check out the skill in action [here](https://www.youtube.com/edit?o=U&video_id=Y4i989zwQlc) and check out the ac unit control panel in home assistant [here](ha-ac.jpg).

**Table Of Contents**
- [Background](#background)
- [Obtaining the IR packets](#obtaining-the-ir-packets)
- [Configuring Home Assistant](#configuring-home-assistant)
  - [Preparing the configuration](#preparing-the-configuration)
  - [Creating the entities](#creating-the-entities)
    - [Fan control](#fan-control)
    - [Mode control](#mode-control)
    - [Temperature control](#temperature-control)
    - [Power control](#power-control)
    - [Disguising the temperature](#disguising-the-temperature)
      - [Template sensor](#template-sensor)
      - [Template cover](#template-cover)
    - [Grouping the controllers](#grouping-the-controllers)
    - [Customizing the entities](#customizing-the-entities)
  - [Incorporating the IR packets](#incorporating-the-ir-packets)
    - [Scripts](#scripts)
      - [Send ir packets to broadlink script](#send-ir-packets-to-broadlink-script)
      - [Scripts for constructing the ir packet](#scripts-for-constructing-the-ir-packet)
        - [Mode: COOL and Fan: LOW](#mode-cool-and-fan-low)
        - [Mode: COOL and Fan: MED](#mode-cool-and-fan-med)
        - [Mode: COOL and Fan: HIGH](#mode-cool-and-fan-high)
        - [Mode: COOL and Fan: AUTO](#mode-cool-and-fan-auto)
        - [Mode: HEAT and Fan: LOW](#mode-heat-and-fan-low)
        - [Mode: HEAT and Fan: MED](#mode-heat-and-fan-med)
        - [Mode: HEAT and Fan: HIGH](#mode-heat-and-fan-high)
        - [Mode: HEAT and Fan: AUTO](#mode-heat-and-fan-auto)
      - [Choose the correct ir packet constructor script](#choose-the-correct-ir-packet-constructor-script)
    - [Automations](#automations)
      - [Run scripts for power on](#run-scripts-for-power-on)
      - [Run scripts for power off](#run-scripts-for-power-off)
      - [Run scripts when the controllers changes state](#run-scripts-when-the-controllers-change-state)
- [Alexa Smart Home Skill](#alexa-smart-home-skill)
  - [Prerequisites for running the skill](#prerequisites-for-running-the-skill)
    - [Configuring Node JS](#configuring-node-js)
  - [Configuring the skill](#configuring-the-skill)
  - [Configuring the skill interface: Part 1](#configuring-the-skill-interface-part-1)
  - [Configuring the lambda function](#configuring-the-lambda-function)
  - [Creating the security profile](#creating-the-security-profile)
  - [Configuring the skill interface: Part 2](#configuring-the-skill-interface-part-1)
  - [Activating the skill](#activating-the-skill)

## Background
So... I have a couple of IR controlled air-conditioner units that I wanted to make smarter. </br>
The first part was easy, I purchased a [*Broadlink RM Pro*](https://www.aliexpress.com/item/Broadlink-RM2-RM-Pro-Smart-home-Automation-Universal-Intelligent-wireless-remote-control-WIFI-IR-RF-switch/32738344424.html?spm=a2g0s.9042311.0.0.svn7ka) for my living room's ac unit, and a [*Broadlink RM Mini*](https://www.aliexpress.com/item/Broadlink-RM2-RM-PRO-Smart-Home-Automation-WiFi-IR-RF-Universal-Intelligent-Wireless-remote-Controller-for/32729931353.html?spm=a2g0s.9042311.0.0.svn7ka) for my bedroom's ac unit.</br>
These devices are actually a smarter universal remote that you can access remotely a create different scenarios for using your various ir/rf devices (only the pro version supports rf), I've been using them for more than a year now and they work great! </br>
For this project I've used my broadlink devices as IR Transmitters. The ir codes management is handled by home assistant and activated with [Amazons' Alexa](https://www.amazon.com/Amazon-Echo-And-Alexa-Devices/b?ie=UTF8&node=9818047011).

## Obtaining the IR packets
The first thing you need to do is obtain the ir packets for your ac unit, it's important to remember in regards to the basic ac unites that has a remote with a screen showing all the ac data, the ir packets that will be sent to the unit will contain all the needed information in one packet. </br>
For example, let's say that my remote displays mode:HEAT, fan:LOW and Temperature:26C, when I'll press the ON button, the remote will send a packet constructed from "HEAT+LOW+26".</br>
Now, if I press the + button to increase the temperature after I've turned on the unit, the remote will send a packet constructed from "HEAT+LOW+27". </br>
If I then change the mode to COOL, assuming my remote remembers my unit is on, it will send a packet constructed from "COOL+LOW+27". </br>
If I press the OFF button on my remote, it will just send "OFF" to the unit, and if my remote remembers that the unit if off, any change I'll make to the temperature, mode, fan or any other setting, will not be sent to the unit, it will only be displayed and saved in the remote waiting for when I'll press the ON button. </br>

My living room's ac unit (which is the one I'll be using in this example) has the following settings:
- Select mode: COOL/HEAT.
- Select FAN: LOW/MED/HIGH/AUTO
- Select temperature: 17-32 Celsius.

Which means: 2 modes X 4 fan levels X 17 possible temperatures + 1 off command = **137 packets** I needed to obtain in order to be able to control my ac unit properly. </br>

There are a couple of ways you can obtain your packets, </br>
- You can teach the packets to your broadlink which is pretty easy, after your done you can extract the code packets from the broadlink settings using NightRang3r's [scripts](https://github.com/NightRang3r/Broadlink-e-control-db-dump), it's pretty straight forward. Please note the script is designed for use with python 2.7, so if you are using python 3 and above, you're going to need to make some adjustments to the script. Also, please note you're going to need an android device to extract the settings files from.
- You can extract the packets using the *learn_command* service from the *brodlink* platform in *home assistant* as described [here](https://home-assistant.io/components/switch.broadlink/#how-to-obtain-irrf-packets). Please note that this method might take a little longer, but it doesn't require and programing knowledge or android device. </br>
In my case, I had all the packets already in my broadlink app, so it didn't make much sense using the learn_command service, I ended up using a modified version of NightRang3r scripts I found online. </br>

Once you have all your packets ready, you can jump to the fun stuff... configuring home assistant. :-)

## Configuring Home Assistant
### Preparing the configuration
I like to keep my entities organized, I'm using different yaml files for each platform. Therefor when I reference a unknown yaml file, it actually means I have it included in my configuration:</br>
```yaml
# configuration.yaml

homeassistant:
  customize: !include customize_ent.yaml

input_select: !include input_select.yaml
input_boolean: !include input_boolean.yaml
input_text: !include input_text.yaml
cover: !include covers.yaml
sensor: !include sensors.yaml
group: !include groups.yaml
automation: !include automations.yaml
script: !include scripts.yam
```
### Creating the entities
The basic ac unit has four controllers: fan, mode, temperature and power control. You need to create an entity for each one of these controllers:</br>
#### Fan control
The first controller we'll create is the Fan controller, which is going to be *input_select* entity:</br>
```yaml
# input_select.yaml
lr_ac_fan:
  name: lr_ac_fan
  options:
    - LOW
    - MED
    - HIGH
    - AUTO
```
#### Mode control
The second controller we'll create is the Mode controller, which is also going to be an *input_select* entity:</br>
```yaml
# input_select.yaml
lr_ac_mode:
  name: lr_ac_mode
  options:
    - COOL
    - HEAT
```
#### Temperature control
The third controller we'll create is the Temperature controller, use an *input_text* entity for this one:</br>
```yaml
# input_text.yaml
lr_ac_temp_text:
  name: lr_ac_temp_text
```
#### Power control
The fourth controller will be the power controller, use an *input_boolean* entity:</br>
```yaml
# input_boolean.yaml
lr_ac_status:
  name: "lr_ac_status"
  initial: off
```
#### Disguising the temperature
Actually, these four controllers is all you need to control your ac unit, but controlling the temperature with an *input_text* entity is not very comfortable, so hide it with two more entities:</br>
##### Template sensor
Used a sensor with the template platform to display the current value of the input_text as a sensor and not as an editable entity:
```yaml
# sensors.yaml
- platform: template
  sensors:
    lr_ac_temp_sensor:
      value_template: "{{ states.input_text.lr_ac_temp_text.state }}"
```
##### Template cover
After disguising the *input_text* with a *sensor*, you can't actually edit the "sensor" value, so add a cover with the template platform to not only control the value of the temperature, but also to limit the range of the allowed temperatures with you ac unit, my unit supports 16-32 Celsius degrees, you can change these values for what ever is supported in your unit:</br> 
```yaml
# covers.yaml
- platform: template
  covers:
    lr_ac_temp_cover:
      position_template: "{% if states.sensor.lr_ac_temp_sensor ==  none %}25{% else %}{{ states.sensor.lr_ac_temp_sensor.state | int }}{% endif %}"
      open_cover:
        service: input_text.set_value
        data_template:
          entity_id: input_text.lr_ac_temp_text
          value: "{{ [((states.input_text.lr_ac_temp_text.state | int) + 1), 32] | min }}"
      close_cover:
        service: input_text.set_value
        data_template:
          entity_id: input_text.lr_ac_temp_text
          value: "{{ [((states.input_text.lr_ac_temp_text.state | int) - 1), 16] | max }}"
```
#### Grouping the controllers
To create a panel to show in home assistant, group the created entities, please note that I didn't include the input_text entity, I've used the template sensor and template cover instead:</br>
```yaml
living_room_ac:
  name: living_room_ac
  entities:
    - input_boolean.lr_ac_status
    - sensor.lr_ac_temp_sensor
    - cover.lr_ac_temp_cover
    - input_select.lr_ac_mode
    - input_select.lr_ac_fan
```
#### Customizing the entities
Customize your entities with names and icons:</br>
```yaml
#customize_ent.yaml
input_boolean.lr_ac_status:
  friendly_name: "Status"
  icon: mdi:air-conditioner
sensor.lr_ac_temp_sensor:
  friendly_name: "Current Temperature"
  icon: mdi:thermometer
cover.lr_ac_temp_cover:
  friendly_name: "Change Temperature"
  icon: mdi:temperature-celsius
input_select.lr_ac_mode:
  friendly_name: "Mode"
  icon: mdi:weather-windy-variant
input_select.lr_ac_fan:
  friendly_name: "Fan"
  icon: mdi:fan
group.living_room_ac:
  friendly_name: "Living Room AC"
  control: hidden
```
This is what the end result looks like in Home Assistant:</br>
![ha-ac_mockup](ha-ac.jpg)

### Incorporating the IR packets
After creating the ac control panel, the entities aren't actually doing anything, in order to make them control the ac unit, you're going to have to wrap them up with scripts and automations. </br>
#### Scripts
In order to make things as generic as possible to allow a quick add of more ac units, I've split the script into multiple scripts, which will make a "chain of scripts" controlling the ac unit.</br>
To make this chain of scripts as clear as I can, I'll start at the final script and work my way up the chain. </br>
All the scripts resign inside the *scripts.yaml* file.
##### Send ir packets to broadlink script
The final script is pretty simple, it receives an incoming parameter called *packet_code* containing an ir packet, and register it with the designated service of your broadlink device.</br>
Please note that service name contains the ip address of your broadlink device, get yours from the *services tool* in home assistant:</br>
```yaml
living_room_rm_pro_send_packet:
  sequence:
    - service: switch.broadlink_send_packet_XXX_XXX_XXX_XXX
      data_template:
        packet:
          - '{{ packet_code }}'
```
##### Scripts for constructing the ir packet
As I said before, my ac unit supports 2 modes, 4 fan levels and 17 possible degrees.</br>
Create 8 scripts based on *mode+fan* each script contains their own 17 possible packets for the *mode+fan+chossen temperature*.</br>
Based on the value the scripts receive with the incoming parameter named *selected_temp*, the script will call the former script setting the correct ir code in the outgoing *packet_code* parameter. You need to copy your pre-obtained ir packets within the designated *if* statement in the correct script:</br>
###### Mode: COOL and Fan: LOW
```yaml
living_room_ac_cool_low_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:COOL+fan:LOW+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:COOL+fan:LOW+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:COOL+fan:LOW+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:COOL+fan:LOW+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:COOL+fan:LOW+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:COOL+fan:LOW+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:COOL+fan:LOW+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:COOL+fan:LOW+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:COOL+fan:LOW+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:COOL+fan:LOW+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:COOL+fan:LOW+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:COOL+fan:LOW+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:COOL+fan:LOW+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:COOL+fan:LOW+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:COOL+fan:LOW+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:COOL+fan:LOW+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:COOL+fan:LOW+temperature:32"
          {% endif %}
```
###### Mode: COOL and Fan: MED
```yaml
living_room_ac_cool_med_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:COOL+fan:MED+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:COOL+fan:MED+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:COOL+fan:MED+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:COOL+fan:MED+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:COOL+fan:MED+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:COOL+fan:MED+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:COOL+fan:MED+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:COOL+fan:MED+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:COOL+fan:MED+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:COOL+fan:MED+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:COOL+fan:MED+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:COOL+fan:MED+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:COOL+fan:MED+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:COOL+fan:MED+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:COOL+fan:MED+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:COOL+fan:MED+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:COOL+fan:MED+temperature:32"
          {% endif %}
```
###### Mode: COOL and Fan: HIGH
```yaml
living_room_ac_cool_high_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:COOL+fan:HIGH+temperature:32"
          {% endif %}
```
###### Mode: COOL and Fan: AUTO
```yaml
living_room_ac_cool_auto_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:COOL+fan:AUTO+temperature:32"
          {% endif %}
```
###### Mode: HEAT and Fan: LOW
```yaml
living_room_ac_heat_low_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:HEAT+fan:LOW+temperature:32"
          {% endif %}
```
###### Mode: HEAT and Fan: MED
```yaml
living_room_ac_heat_med_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:HEAT+fan:MED+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:HEAT+fan:MED+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:HEAT+fan:MED+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:HEAT+fan:MED+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:HEAT+fan:MED+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:HEAT+fan:MED+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:HEAT+fan:MED+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:HEAT+fan:MED+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:HEAT+fan:MED+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:HEAT+fan:MED+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:HEAT+fan:MED+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:HEAT+fan:MED+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:HEAT+fan:MED+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:HEAT+fan:MED+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:HEAT+fan:MED+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:HEAT+fan:MED+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:HEAT+fan:MED+temperature:32"
          {% endif %}
```
###### Mode: HEAT and Fan: HIGH
```yaml
living_room_ac_heat_high_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:HEAT+fan:HIGH+temperature:32"
          {% endif %}
```
###### Mode: HEAT and Fan: AUTO
```yaml
living_room_ac_heat_auto_script:
  sequence:
    - service: script.living_room_rm_pro_send_packet
      data_template:
        packet_code: >
          {% if (selected_temp == "16") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:16"
          {% elif (selected_temp == "17") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:17"
          {% elif (selected_temp == "18") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:18"
          {% elif (selected_temp == "19") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:19"
          {% elif (selected_temp == "20") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:20"
          {% elif (selected_temp == "21") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:21"
          {% elif (selected_temp == "22") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:22"
          {% elif (selected_temp == "23") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:23"
          {% elif (selected_temp == "24") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:24"
          {% elif (selected_temp == "25") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:25"
          {% elif (selected_temp == "26") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:26"
          {% elif (selected_temp == "27") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:27"
          {% elif (selected_temp == "28") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:28"
          {% elif (selected_temp == "29") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:29"
          {% elif (selected_temp == "30") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:30"
          {% elif (selected_temp == "31") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:31"
          {% elif (selected_temp == "32") %} "place ir packet here for mode:HEAT+fan:AUTO+temperature:32"
          {% endif %}
```
##### Choose the correct ir packet constructor script
Create a script that calls of the 8 scripts above. The script receives three incoming parameters: *selected_mode* and *selected_fan* will be used to determine the correct script to run, the *selected_temp* parameter will be passed throu to to the called script:</br>
```yaml
living_room_ac_check_state_script:
  sequence:
    - service_template: >
        {% if (selected_mode.lower() == "cool") %}
          {% if (selected_fan.lower() == "low") %} script.living_room_ac_cool_low_script
          {% elif (selected_fan.lower() == "med") %} script.living_room_ac_cool_medium_script
          {% elif (selected_fan.lower() == "high") %} script.living_room_ac_cool_high_script
          {% elif (selected_fan.lower() == "auto") %} script.living_room_ac_cool_auto_script
          {% endif %}
        {%-elif (selected_mode.lower() == "heat") %}
          {% if (selected_fan.lower() == "low") %} script.living_room_ac_heat_low_script
          {% elif (selected_fan.lower() == "med") %} script.living_room_ac_heat_medium_script
          {% elif (selected_fan.lower() == "high") %} script.living_room_ac_heat_high_script
          {% elif (selected_fan.lower() == "auto") %} script.living_room_ac_heat_auto_script
          {% endif %}
        {% endif %}
      data_template:
        selected_temp: '{{ selected_temp }}'
```
#### Automations
Now that you have all of your controls set up and all of you scripts waiting to be called, build a couple of automations to call the scripts based on the controls entity states.</br>
All the automations resign inside the *automations.yaml* file.</br>
##### Run scripts for power on
The following automation executes whenever the state for our *input_boolean* entity, which is the power controller for the ac unit, changes to "ON". The automation calls the script for choosing the ir packet constructor script, setting the states of the mode, fan and temperature entities as outgoing parameters:</br>
```yaml
- id: lr_ac_status_on
  alias: lr_ac_status_on
  trigger:
    platform: state
    entity_id: input_boolean.lr_ac_status
    to: 'on'
  action:
    service: script.living_room_ac_check_state_script
    data_template:
      selected_mode: '{{ states.input_select.lr_ac_mode.state }}'
      selected_fan: '{{ states.input_select.lr_ac_fan.state }}'
      selected_temp: '{{ states.sensor.lr_ac_temp_sensor.state }}'
```
##### Run scripts for power off
The following automation executes whenever the state of the *input_boolean* entity, which is the power controller for the ac unit, changes to "ON". The automation calls the script for sending ir packets to the broadlink device setting the ir packet obtained for off as an outgoing parameter:</br>
```yaml
- id: lr_ac_status_off
  alias: lr_ac_status_off
  trigger:
    platform: state
    entity_id: input_boolean.lr_ac_status
    to: 'off'
  action:
    service: script.living_room_rm_pro_send_packet
    data:
      packet_code:
        - "Place the ir packet for OFF here"
```
##### Run scripts when the controllers changes state
The following script runs whenever one of the controllers for mode (input_select), fan (input_select) or temperature (sensor) changes their states as long as the power (input_boolean) is on. The automation calls the script for choosing the ir packet constructor script, setting the states of the mode, fan and temperature entities as outgoing parameters:</br>
```yaml
- id: lr_ac_changes
  alias: lr_ac_changes
  trigger:
    - platform: state
      entity_id: sensor.lr_ac_temp_sensor
    - platform: state
      entity_id: input_select.lr_ac_mode
    - platform: state
      entity_id: input_select.lr_ac_fan
  action:
    - condition: state
      entity_id: input_boolean.lr_ac_status
      state: 'on'
    - service: script.living_room_ac_check_state_script
      data_template:
        selected_mode: '{{ states.input_select.lr_ac_mode.state }}'
        selected_fan: '{{ states.input_select.lr_ac_fan.state }}'
        selected_temp: '{{ states.sensor.lr_ac_temp_sensor.state }}'
```
Restart you home assistant for the changes to take effect, you can run a configuration check before restarting to look for any syntax errors. </br>
That's it. You can now control your ac unit with Home Assistant and broadlink devices. </br>

Now, jump over to the Alexa section which covers "binding" the controller entities in Home Assistant to a Smart Thermostat for Alexa.
## Alexa Smart Home Skill
Alexa Smart Home Skill allows us to configure smart home devices for natively controlling with alexa, such a device, from alexa's point of view is called an *endpoint*.</br>
This section will guide you on building a Smart Home Skill that will bind the Home Assistant entities as an endpoint of type Smart Thermostat, allowing you to control the ac unit natively:</br>
- Alexa, turn on the *endpoint name*
- Alexa, set the temperature of the *endpoint name* to 28
- Alexa, set the *endpoint name* to heat
- Alexa, what is the temperature of the *endpoint name*

Please note, a basic thermostat usually contains a temperature, mode and power settings. The fan setting doesn't exist. Therefore, you will not be able to control the fan level with alexa for now, but I'm working on a workaround for it. I will update this repository as soon as I'll have it working. </br>
For now, controlling the power, mode and temperature settings natively with alexa is extremely convenient as you can see in my [YouTube video](https://www.youtube.com/edit?o=U&video_id=Y4i989zwQlc).</br>
### Prerequisites for running the skill
There are a couple of things you need before running this skill:</br>
- Create an account in [Amazon Developer Portal](https://developer.amazon.com/), in here you will configure your skill.
- Create and account [Amazon Web Services Portal](https://aws.amazon.com/), you're going to use Amazon's Lambda servers to host the skill.
- The skill is written *JavaScript* (there is no need for any prior knowledge in JS) and packaged with *Node Package Manager*, you will need to download and configure *Node JS* on your computer in order to compile the package.

#### Configuring Node JS
Download and install [Node JS](which includes npm) for windows from [here](https://nodejs.org/en/download/), after installing, open the start menu and search for *Edit the system environment variables*, open it and click the *Environment Variables...* button at the bottom.</br>
Locate the *Path* variable and add a new entry with the path of your Node JS installations, (for example - C:\Program Files\nodejs\).</br>
To check you installation, Open Command Prompt (cmd) from the start menu and type *npm -where* your npm version and path will be displayed. </br>
### Configuring the skill
- Download this repository as a zip file and extract to a temporary folder on your windows computer.
- Locate the extracted files and open the *conf* folder, inside you will find two *json* files: *endpoints_config* for configuring your endpoint and *hass_api_config* for configuring you Home Assistant API access. Open both files in any text editor and modify the following values inside the quotation marks in a similar manner to the existing example:</br>

In endpoints_config.json, configure your ac unit, you can add additional unit as JSON objects inside the JSON array as in the downloaded example. If you have only one unit, remove the one of the JSON object from the JSON array, don't forget to remove the comma as well:</br>
``` json
[{
	"endpoint_unique_id": "A unique endpoint id for backend use between alexa and the skill",
	"alexa_friendly_name": "The name of the device as you want it to be used for controlling with alexa",
	"status_input_boolean": "The full entity id for Power Control input_boolean",
	"degrees_control": {
		"degrees_input_text": "The full entity id for the Temperature Control input_text",
		"min_degree": "the minimum temperature accepted by your ac unit - no quotation marks required",
		"max_degree": "the maximum temperature accepted by your ac unit - no quotation marks required"
	},
	"mode_input_select": "The full entity id for the Mode Control input_select"
}]
```
In hass_api_config.json, configure your Home Assistant API:</br>
```json
{
	"api_url": "Your ha address (please use a fixed dns name and not an interchangeable address) for example https://my-ha.duckdns.org",
	"api_port": "The port accessible to your ha - no quotation marks required for example 443",
	"api_password": "Your ha api_password"
}
```
- Open Command Prompt with administrative privileges and navigate into the folder you have extracted this repository to (the path where you can find the *package.json* file.
- Type *npm install*, npm will download the modules required by our skill into a new folder called *node_modules*.
- Zip the entire **content** (not the folder itself) of the folder you have extracted this repository to (we'll use the zip file later). The zip file should contain the following:
  - conf
  - node_modules
  - lambda.js
### Configuring the skill interface: Part 1
In [Amazon Developer Portal](https://developer.amazon.com/), sign in, click the *DEVELOPER CONSOLE*, the *ALEXA* tab and under *Alexa Skills Kit* click *Get Started*.</br>
In skill management window, click *Add a New Skill* and configure your skill according to the following with one rule, if I didn't mention a setting, leave it with its default value, when you're done with this part, don't close the tab, you going to come back here later. </br>
In the Skill Information Tab, set the following and save:
- Skill Type: Smart Home Skill API
- Name: Whatever you want, just keep in mind you will need to identify this skill later.
### Configuring the lambda function
In [Amazon Web Services Portal](https://aws.amazon.com/), sign in, in the "AWS services" module search and locate *Lambda*, click it and then click *Create Function*:
- Select *Author from scratch*
- Name: Give it whatever name you want, just keep in mind that the name will help you idetify the function.
- Choose an existing role, or create one from a template.
- Your lambda function is created, in the *Function code* module, under *Code entry type* select *Upload a .Zip file*.
- Browse and upload the zip file you've created in [*Configuring the skill* section](#configuring-the-skill).
- Under *Handler info* type *lambda.handler*. Please note that the runtime is *Node.js 6.10*.
- Scroll down to the *Basic settings* module and select time out of 8 seconds.
- Scroll back up to the *Configuration* module and from the left bar list click on *Alexa Smart Home*.
- In the new added *Configure triggers* module, under *Application Id* paste the application id assigned to your skill in the [*Configuring the skill interface: Part 1* section](#configuring-the-skill-interface-part-1), it looks like this *amzn1.ask.skill.#unique-skill_identifier*. Please note that trigger is enabled.
- Save your function and don't close this tab, you're going to need it later.
### Creating the security profile
For Smart Home Skills, Amazon forces us to use *lambda* as host for the skill, which we did in previous steps, and *OAUTH 2 Authorization Framework* for identifying the users. Fortunately for us, Amazon also has a service called *Login with Amazon* which allows to create security profile for supporting OAUTH 2. Thant means we can allow our users to login with their amazon account instead of creating our own authorization infrastructure and manage our own users. This is especially great for this project. Considering this skill is for personal use only and not meant to be published, using Amazon's security profile will save the trouble of authenticating ourselves.</br>
Open [Amazon Developer Portal](https://developer.amazon.com/) in a different tab (leave the current developer portal tab open, you will need it), sign in and this time click on the *APPS & SERVICES* tab and then click *Login with Amazon* sub-menu.</br>
Click *Create a New Security Profile* and give the profile a name and a description. In the *Privacy URL* just put any URL you want, you can put your ha link if you want, no one besides you is going to have access to this page. Click save to save your profile. </br>
Go into the created profile and click on the *Web Settings* tab, you need to allow a return URL, go back to original developer portal tab and click *Configuration* in the right menu. Scroll down until you see *Redirect URLs*. </br>
- *pitangui.amazon.com* is the URL for inside the US.
- *layla.amazon.com* is for outside of the US.
- *alexa.amazon.co.jp* is for Japan.

Save the security profile, but don't close the tab, you will need it for the next step.
### Configuring the skill interface: Part 2
Go back to [Amazon Developer Portal](https://developer.amazon.com/)(the original tab where we started creating our skill), and click *Configuration* on the right menu and fill in the following:
- Default: Paste the *arn* from the function you've created in the [*Configuring the lambda function* section](#configuring-the-lambda-function), it looks like this: *arn:aws:lambda:us-east-1:unique-function-identifier*.
- Authorization URL: type *https://www.amazon.com/ap/oa/?redirect_url=* concatenated with the selected Redirect URL from the previous step.
- Client Id: paste the *Client ID* from the security profile you've created in the previous step.
- Scope: type *profile*
- Access Token URI: type *https://api.amazon.com/auth/o2/token*
- Client Secret: paste the *Client Secret* from the security profile you've created in the previous step.
- Client Authentication Scheme: select *Credentials in request body*.
- Privacy Policy URL: type any valid URL, you can type your ha URL if you want, no one going to have access to this page but you.

Click save. After saving, if you look into the *Test* menu and make sure that *Start testing this skill* is marked yes.</br>
Click on the *Privacy & Compliance* menu, select *No* in all of the radio buttons and mark the checkbox for *Export Compliance*. Type any URL in the *Privacy Policy URL* and click save.</br>
### Activating the skill
Look in your alexa app, under *Your Skills* you should see your new skill, enable it while identifying with your amazon account.</br>
Ask alexa to discover devices, it should discover your new *Smart Thermostat* and you can natively control it with your speech, here are some examples:
- Alexa, turn on the *endpoint name*
- Alexa, set the temperature of the *endpoint name* to 28
- Alexa, set the *endpoint name* to heat
- Alexa, what is the temperature of the *endpoint name*

Have Fun!
