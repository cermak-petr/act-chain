const Apify = require('apify');
const _ = require('underscore');
const extend = require('extend');
const Promise = require('bluebird');

function getOutput(output){
    return output ? (output.body || output) : undefined;
}

async function postWebhook(url, execIds){
    const options = {
        method: 'POST',
        uri: url,
        body: JSON.stringify(execIds),
        json: true
    };
    await request(options);
}

async function runAct(actId, input, opts){
    const data = extend({
        actId: actId, 
        body: JSON.stringify(input)
    }, opts);
    if(!data.contentType){data.contentType = 'application/json';}
    return await Apify.client.acts.runAct(data);
}

async function waitForRun(actId, runId){
    let run = null;
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    while(run === null || run.status === 'RUNNING'){
        run = await Apify.client.acts.getRun({actId, runId});
        await wait(1000);
    }
    return await Apify.client.keyValueStores.getRecord({storeId: run.defaultKeyValueStoreId, key: 'OUTPUT'});
}

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');
    const state = (await Apify.getValue('STATE')) || {index: 0, output: input};
    const data = input.data ? (typeof input.data === 'string' ? JSON.parse(input.data) : input.data) : input;
    
    if(!data.acts){
        return console.log('missing "acts" attribute in INPUT');
    }
    
    async function waitForLatest(){
        const act = input.acts[state.index];
        state.output = await waitForRun(act.actId, state.latest.id);
        state.latest = null;
        state.index++;
        await Apify.setValue('STATE', state);
        console.log('act finished: ' + act.actId);
    }
    
    if(state.latest){waitForLatest();}
    
    while(state.index < input.acts.length){
        const act = input.acts[state.index];
        const actInput = act.input || getOutput(state.output);
        if(!actInput){
            return console.log('no input for the next act, stopping execution');
        }
        console.log('starting act: ' + act.actId + '\ninput: ');
        console.dir(actInput);
        state.latest = await runAct(act.actId, actInput, act.opts);
        await Apify.setValue('STATE', state);
        await waitForLatest();
    }
    
    await Apify.setValue('OUTPUT', getOutput(state.output));
    if(data.finalWebhook){
        await postWebhook(input.finalWebhook, state.output);
    }
});
