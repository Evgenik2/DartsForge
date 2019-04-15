	var keyPressTimer = null;
    var keyLongPress = false;
    document.onkeydown = e => {
        if (keyPressTimer === null)
            keyPressTimer = setTimeout(() => {
                keyLongPress = true;
            }, 1000);
    };
    document.onkeyup = e => {
        if (keyPressTimer !== null) {
            clearTimeout(keyPressTimer);
            keyPressTimer = null;
        }
        if(!keyboardKeys.menuShown && keyboardKeys.currentView == 0)
        switch(e.keyCode ? e.keyCode : e.keyChar) {
            case 48: case 96: case 45: keyboardKeys.keyboardClick(0);break;
            case 49: case 97: case 35: keyboardKeys.keyboardClick(1);break;
            case 50: case 98: case 40: keyboardKeys.keyboardClick(2);break;
            case 51: case 99: case 34: keyboardKeys.keyboardClick(3);break;
            case 52: case 100: case 37: keyboardKeys.keyboardClick(4);break;
            case 53: case 101: case 12: keyboardKeys.keyboardClick(5);break;
            case 54: case 102: case 39: keyboardKeys.keyboardClick(6);break;
            case 55: case 103: case 36: keyboardKeys.keyboardClick(7);break;
            case 56: case 104: case 38: keyboardKeys.keyboardClick(8);break;
            case 57: case 105: case 33: keyboardKeys.keyboardClick(9);break;
            case 13: keyLongPress ? keyboardKeys.keyboardLongOk() : keyboardKeys.keyboardOk();break;
            case 8: keyboardKeys.keyboardDelete();break;
            case 46: keyboardKeys.value = keyboardKeys.closes = keyboardKeys.doubles = 0; break;
            case 27: keyboardKeys.menuShown = true; break;
        }
        keyLongPress = false;
    };