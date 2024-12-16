const inputNumberToName = ['up', 'down', 'left', 'right', 'shift'];
const inputNameToNumber = {};
for(let i = 0; i < inputNumberToName.length; i++){
    inputNameToNumber[inputNumberToName[i]] = i;
}
const playerUpdatePackLen = 3;

export default {inputNameToNumber, inputNumberToName, playerUpdatePackLen};