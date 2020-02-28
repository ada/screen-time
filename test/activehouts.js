    // check if it is restricted   
    if (hostSettings.accessRules.length && false) {
        let block = true;
        let now = new Date();
        let tnow = now.getHours() + ":" + now.getMinutes();

        for (let j = 0; j < hostSettings.activeHours.length; j++) {
          const rule = hostSettings.activeHours[j];
          if ((rule.day === "" || rule.day === now.getDay()) &&
            tnow >= rule.start &&
            tnow < rule.end) {
            block = false;
            break;
          }
        }

        if (block === true) {
          let expiredTabs = await browser.tabs.query({ url: "*://*." + hostname + "/*" });
          expiredTabs.forEach(element => {
            browser.tabs.executeScript(element.id, {
              code: 'document.body.style.border = "5px solid red"'
            });
          });

          browser.notifications.create("uid", {
            "type": "basic",
            "iconUrl": browser.runtime.getURL("icons/font-awesome_4-7-0_hourglass-half_48.png"),
            "title": "Access denied",
            "message": "Access to " + hostname + " was blocked. "
          });
        }

    }
