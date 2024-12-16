window.until = (condition, checkInterval=400) => {
    if(!!condition()) return true;
    return new Promise(resolve => {
        let interval = setInterval(() => {
            if (!condition()) return;
            clearInterval(interval);
            resolve();
        }, checkInterval)
    })
}

const memoizedColors = {};

window.blendColor = (color1, color2, t) => {
	function rgbToHex(r, g, b) {
		return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
	}
	
	function componentToHex(c) {
		var hex = c.toString(16);
		return hex.length == 1 ? "0" + hex : hex;
	}
	
	const memoizedIndex = color1 + '_' + color2 + '_' + t;
	if (memoizedColors[memoizedIndex] !== undefined) {
		return memoizedColors[memoizedIndex];
	}
	const rgb1 = {
		r: parseInt(color1.slice(1, 3), 16),
		g: parseInt(color1.slice(3, 5), 16),
		b: parseInt(color1.slice(5, 7), 16)
	}
	const rgb2 = {
		r: parseInt(color2.slice(1, 3), 16),
		g: parseInt(color2.slice(3, 5), 16),
		b: parseInt(color2.slice(5, 7), 16)
	}

	const result = rgbToHex(Math.floor(rgb1.r * (1 - t) + rgb2.r * t), Math.floor(rgb1.g * (1 - t) + rgb2.g * t), Math.floor(rgb1.b * (1 - t) + rgb2.b * t))
	memoizedColors[memoizedIndex] = result;
	return result;
}

window.players = [];
window.entities = [];

const encoder = new TextEncoder();
window.encodeAtPosition = (string, u8array, position) => {
	return encoder.encodeInto(
		string,
		position ? u8array.subarray(position | 0) : u8array,
	);
}
const decoder = new TextDecoder();
window.decodeText = (u8array, startPos=0, endPos=Infinity) => {
	return decoder.decode(u8array).slice(startPos, endPos);
}

window.stringHTMLSafe = (str) => {
	return str.replace(/&/g, '&amp;')
		.replace(/ /g, '&nbsp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

window.interpolate = (s,e,t) => {
	return (1-t) * s + e * t;
}

window.interpolateDirection = (a0,a1,t) => {
	return a0 + window.shortAngleDist(a0,a1)*t;
}

window.shortAngleDist = (a0,a1) => {
	const max = Math.PI*2;
	const da = (a1 - a0) % max;
	return 2*da % max - da;
}

window.resetGame = () => {
    window.entities.length = window.mouseUpFunctions.length = window.mouseDownFunctions.length = window.mouseMoveFunctions.length = 0;
    window.changeCameraScale(1);
    window.camera.numControlledBy = 0;
}