let _hostname; 
let UIButtonAddRule = document.getElementById("ruleFormSubmit");
let UIInputRuleEndTime = document.getElementById("ruleTimeEnd");
let UIInputRuleStartTime = document.getElementById("ruleTimeStart");
let UIInputRuleDay= document.getElementById("ruleDay");

UIButtonAddRule.addEventListener("click", onFormSubmit);

async function onFormSubmit(e){
    e.preventDefault(); 
    console.log(e);
    console.log(UIInputRuleEndTime.value);
}

export async function init(hostname){
    _hostname = hostname; 
}