const Apify = require('apify');
const _ = require('underscore');
const Promise = require('bluebird');

function getOutput(output){
    return (output.output ? output.output.body : false) || output.output || output;
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

Apify.main(async () => {
    const input = await Apify.getValue('INPUT');
    const state = (await Apify.getValue('STATE')) || {index: 0, output: input};
    const data = input.data ? (typeof input.data === 'string' ? JSON.parse(input.data) : input.data) : input;
    if(!data.acts){
        return console.log('missing "acts" attribute in INPUT');
    }
    while(state.index < input.acts.length){
        const act = input.acts[state.index];
        const actInput = act.input || getOutput(state.output);
        console.log('starting act: ' + act.actId);
        console.log('input: ');
        console.dir(actInput);
        state.output = await Apify.call(act.actId, actInput, act.opts);
        state.index++;
        await Apify.setValue('STATE', state);
        console.log('act finished: ' + act.actId);
    }
    await Apify.setValue('OUTPUT', getOutput(output));
    if(data.finalWebhook){
        await postWebhook(input.finalWebhook, output);
    }
});
