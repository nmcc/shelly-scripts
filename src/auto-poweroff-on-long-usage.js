/*
 * Auto Power Off on Long Usage Script for Shelly Devices

 * This script monitors the power consumption of a specified device and automatically 
 * turns it off if it detects that the device has been consuming power 
 * for an extended period (20 minutes by default). 
 * It also sends a notification when the device is turned off automatically.
 * 
 * This script was tested with Shelly PlugS Gen3, but should work with any Shelly 
 * device that reports power consumption.
 * 
 * Copyright (C) 2026 Nuno Caneco
 */

// Configuration variables
const CONFIG = {
  DEVICE: "switch:0",
  TIMEOUT_IN_SECONDS: 20 * 60,
  NOTIFICATION_TITLE: "Device Switch OFF",
  NOTIFICATION_MESSAGE: "The device was switched of automatically after long consumption detected"
};

var last_apower = 0;
var device_off_timer_handler = null;

Shelly.addStatusHandler(function (event) {
  // Uncomment for troubleshooting
  //print("Status of device changed:", JSON.stringify(event));
  
  if(event.component == CONFIG.DEVICE && event.delta.apower != undefined) {
    if(last_apower == 0 && event.delta.apower > 0) {
       print("Device turned ON");
       
       device_off_timer_handler = Timer.set(
         CONFIG.TIMEOUT_IN_SECONDS * 1000,
         false,
         turnItOff); 
         
       print("Activated timer to check power in " + CONFIG.TIMEOUT_IN_SECONDS + " seconds");
    } else if (last_apower > 0 && event.delta.apower == 0) {
       print("Device turned OFF");
       
       if(device_off_timer_handler) {
         Timer.clear(device_off_timer_handler);
       }
    }
    
    last_apower = event.delta.apower;
  }
});

function turnItOff() {
  Shelly.call("Switch.set", {'id': 0, 'on': false});
  print("Device turned OFF automatically due to long usage");
  
  sendNotification(CONFIG.NOTIFICATION_TITLE, CONFIG.NOTIFICATION_MESSAGE);
};

// Function to send notification
function sendNotification(title, message) {
  try {
    Shelly.call(
      "NotifyEvent",
      {
        // Event name is arbitrary but should be unique
        event: "custom.vaccum_auto_off",
        // Data sent with the event
        data: {
          title: title,
          message: message
        }
      },
      function (res, err_code, err_msg) {
        if (err_code !== 0) {
          print("Notification failed:", err_msg);
        } else {
          print("Notification sent:", JSON.stringify(res));
        }
      }
    );
  } catch (e) {
    print("Error sending notification:", e);
  }
}
