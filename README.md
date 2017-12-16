# I'M WORKING ON IT...


# home_assistant_custom_ac_alexa_smarthome_skill
Alexa smart home skill hosted on lambda servers for controlling a custom ir air conditioner build with [Home Assistant](https://home-assistant.io/) controls.</br>
You can check out the skill in action [here](https://www.youtube.com/edit?o=U&video_id=Y4i989zwQlc) and check out the ac unit control panel in home assistant [here](ha-ac.jpg).


## Background
So... I have a couple of IR controlled air-conditioner units that I wanted to make smarter. </br>
The first part was easy, I purchased a [*Broadlink RM Pro*](https://www.aliexpress.com/item/Broadlink-RM2-RM-Pro-Smart-home-Automation-Universal-Intelligent-wireless-remote-control-WIFI-IR-RF-switch/32738344424.html?spm=a2g0s.9042311.0.0.svn7ka) for my living room's ac unit, and a [*Broadlink RM Mini*](https://www.aliexpress.com/item/Broadlink-RM2-RM-PRO-Smart-Home-Automation-WiFi-IR-RF-Universal-Intelligent-Wireless-remote-Controller-for/32729931353.html?spm=a2g0s.9042311.0.0.svn7ka) for my bedroom's ac unit.</br>
These devices are actually a smarter universal remote that you can access remotely a create different scenarios for using your various ir/rf devices (only the pro version supports rf), I've been using them for more than a year now and they work great!</br>
For this project I've used my broadlink devices as IR Transmitters. The ir codes management is handled by home assistant and activated with [Amazons' Alexa](https://www.amazon.com/Amazon-Echo-And-Alexa-Devices/b?ie=UTF8&node=9818047011).

## Obtain the IR packets
The first thing you need to do is obtain the ir packets for you ac unit, it's important to remember in regards to the basic ac unites that has a remote with a screen showing all the ac data, the ir packets that will be sent to the unit will contain all the needed information in one packet. </br>
For example, let's say that my remote displays mode:HEAT, fan:LOW low and Temperature:26C, when I'll press the ON button, the remote will send a packet constructed from "HEAT+LOW+26".</br>
Now, if I press the + button to increase the temperature after I've turned on the unit, the remote will send a packet constructed from "HEAT+LOW+27". </br>
If I then change the mode to COOL, assuming my remote remembers my unit is on, it will send a packet constructed from "COOL+LOW+27". </br>
If I press the OFF button on my remote, it will just send "OFF" to the unit, and if my remote remembers that the unit if off, any change I'll make to the temperature, mode, fan or any other setting, will not be sent to the unit, it will only be displayed and saved in the remote waiting for when I'll press the ON button. </br>

My living room's ac unit (which is the one I'll be using in this example) has the following settings:
- Select mode: COOL/HEAT.
- Select FAN: LOW/MED/HIGH/AUTO
- Select temperature: 17-32 Celsius.

Which means: 2 modes X 4 fan levels X 16 possible temperatures + 1 off command = 129 packets I needed to obtatin in order to be able to control my ac unit properly. </br>

There are a couple of ways you can obtain your packets, </br>
- You can teach the packets to your broadlink which is pretty easy, after your done you can extract the code packets from the broadlink settings using NightRang3r's [scripts](https://github.com/NightRang3r/Broadlink-e-control-db-dump), it's pretty straight forward. Please note the script is designed for use with python 2.7, so if you are using python 3 and above, you're going to need to make some adjustments to the script. Also, please note you're going to need an android device to extract the settings files from.
- You can extract the packets using the *learn_command* service from the *brodlink* platform in *home assistant* as described [here](https://home-assistant.io/components/switch.broadlink/#how-to-obtain-irrf-packets). Please note that this method might take a little longer, but it doesn't require and programing knowledge or android device. </br>
In my case, I had all the packets already in my broadlink app, so it didn't make much sense using the learn_command service, I ended up using a modified version of NightRang3r scripts I found online. </br>

Once you have all your packets ready, you can jump to the fun stuff... configuring home assistant. :-)

## Configuring Home Assistat
### Prepare our configuration
I like to keep my entities orginaized, I'm using diffrent yaml files for each platform. Therefor when I reference a unknown yaml file, it actually means I have it included in my configuration:</br>
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
### Create the entities
The basic ac unit has four controllers: fan, mode, temperature and power control. You need to create an entity for each one of these contollers:</br>
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
Actually, these four controllers is all you need to control your ac unit, but controlling the temperature with an *input_text* entity is not very comftirable, so hide it with two more entities:</br>
##### Template sensor
Used a sensor with the tempalate platform to dispaly the current value of the input_text as a sensor and not as an editable entity:
```yaml
# sensors.yaml
- platform: template
  sensors:
    lr_ac_temp_sensor:
      value_template: "{{ states.input_text.lr_ac_temp_text.state }}"
```
##### Template cover
After disguising the *input_text* with a *sensor*, you can't actually edit the "sensor" value, so add a cover with the template platform to not only control the value of the temperature, but also to limit the range of the allowed temperatures with you ac unit, my unit supports 16-32 celsius degrees, you can change these values for what ever is supported in your unit:</br> 
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
#### Group the controllers
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
#### Customize the entities
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

## Alexa Stuff
