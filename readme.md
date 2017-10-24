# act-chain

This act chains other acts by piping their outputs into inputs.

**INPUT**

It accepts input in the following format:
```javascript
{ "acts": [
    { 
        "actId": "user_name/act_1_name",
        "input": "act_1_input"  // input is defined
    },
    {
        "actId": "user_name/act_2_name",
        "opts": "act_2_options"  // additional act calling options,
        // no input defined, act gets previous act's output as input
    },
    ...
] }
```

__This act returns the output of the last act in the chain.__
