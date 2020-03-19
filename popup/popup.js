import { isTracked } from '../component/tracker.js';
import { parseHostname } from '../component/util.js';
import { init as initRulesController} from '../component/UIRulesController.js';
import { init as initAlarmsController} from '../component/UIAlarmsController.js';
import { init as initOptionsController} from '../component/UIOptionsController.js';
import { init as initNavigationController} from '../component/UINavigationController.js';
import { init as initChartController} from '../component/UIChartController.js';

async function init(tabs) {
    let hostname = parseHostname(tabs[0].url);
    
    if (hostname.length === 0 || hostname.indexOf(".") === -1) {
        window.close();
    }

    let tracked = await isTracked(hostname);

    initNavigationController(tracked);
    initOptionsController(hostname);

    if (!tracked) {
        return;
    }

    initAlarmsController(hostname);
    initChartController(hostname);
    initRulesController(hostname);
}

/* 
    Retrieve the active tab where the popup is shown
*/
browser.tabs.query({ active: true, currentWindow: true }).then(init);
