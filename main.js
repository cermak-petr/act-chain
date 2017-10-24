const Apify = require('apify');
const _ = require('underscore');
const Promise = require('bluebird');

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
    const data = input.data ? (typeof input.data === 'string' ? JSON.parse(input.data) : input.data) : input;
    if(!data.acts){
        return console.log('missing "acts" attribute in INPUT');
    }
    let output = input;
    for(let act of input.acts){
        const actInput = act.input || output.output.body || output.output || output;
        console.log('starting act: ' + act.actId);
        console.log('input: ');
        console.dir(actInput);
        output = await Apify.call(act.actId, actInput, act.opts);
        console.log('act finished: ' + act.actId);
    }
    await Apify.setValue('OUTPUT', output.output.body || output.output || output);
    if(data.finalWebhook){
        await postWebhook(input.finalWebhook, output);
    }
});
