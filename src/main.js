// Application API:

Document.prototype.listen = HTMLElement.prototype.listen = function listen(eventName, callback) {
    if (this && callback) {
        this.addEventListener(eventName, callback, false);
    }
    return this;
}

HTMLElement.prototype.onKeyup = function onKeyup(callback) {
    return this.listen('keyup', callback);
}

HTMLElement.prototype.onClick = function onClick(callback) {
    return this.listen('click', callback);
}

HTMLElement.prototype.toggleClassDisplayNone = function toggleClassDisplayNone() {
    if (!this) return undefined;
    this.classList.toggle('display-none');
    return this;
}

HTMLElement.prototype.setDisabled = function setDisabled() {
    if (!this) return undefined;
    this.disabled = true;
    return this;
}

HTMLElement.prototype.unsetDisabled = function unsetDisabled() {
    if (!this) return undefined;
    this.disabled = false;
    return this;
}

HTMLInputElement.prototype.setBlankValue = function setBlankValue() {
    if (!this) return undefined;
    this.value = '';
    return this;
}

String.prototype.isNonBlank = function nonBlank() {
    return this && this.trim().length;
}

String.prototype.toNumber = function toNumber() {
    return !this ? undefined : +this;
}

KeyboardEvent.prototype.onEnter = function onEnter(callback) {
    if (!!callback && !!this && !!this.key && this.key === 'Enter') {
        callback();
    }
    return this;
}

document.listen('DOMContentLoaded', main);

function main() {

    const $ = selector => document.querySelector(selector);

    const $firstOperandInput = $('#first-value');
    const $secondOperandInput = $('#second-value');
    const $sumInput = $('#sum');

    const $step1Section = $('#step-1');
    const $step2Section = $('#step-2');

    const keys = Object.freeze({
        FIRST_OPERAND: 'FIRST_OPERAND',
        SECOND_OPERAND: 'SECOND_OPERAND',
        SUM: 'SUM',
    });
    const values = {
        [keys.FIRST_OPERAND]: '',
        [keys.SECOND_OPERAND]: '',
        [keys.SUM]: '',
    };

    $('#results-check').onClick(onResultsCheck);
    $('#clear-and-replay').onClick(onClearAndReplay);

    $firstOperandInput.onKeyup(onFirstOperand);
    $secondOperandInput.onKeyup(onSecondOperand);
    $sumInput.onKeyup(onSum);

    const canShowCheck = () =>
        values[keys.FIRST_OPERAND].isNonBlank()
        && values[keys.SECOND_OPERAND].isNonBlank()
        && values[keys.SUM].isNonBlank();

    function onFirstOperand(e) {
        values[keys.FIRST_OPERAND] = e.target.value;
        e.onEnter(() => $firstOperandInput.setDisabled());
        checkIfInitialStep1(e);
    }

    function onSecondOperand(e) {
        values[keys.SECOND_OPERAND] = e.target.value;
        e.onEnter(() => $secondOperandInput.setDisabled());
        checkIfInitialStep1(e);
    }

    function onSum(e) {
        values[keys.SUM] = e.target.value;
        e.onEnter(() => $sumInput.setDisabled());
        checkIfInitialStep1(e);
    }

    function checkIfInitialStep1(e) {
        e.onEnter(() => {
            if (canShowCheck()) {
                $step1Section.toggleClassDisplayNone();
                $firstOperandInput.setDisabled();
                $secondOperandInput.setDisabled();
                $sumInput.setDisabled();
            }
        });
    }

    function onResultsCheck() {
        const firstNumber = values[keys.FIRST_OPERAND].toNumber();
        const secondNumber = values[keys.SECOND_OPERAND].toNumber();
        const sumNumber = values[keys.SUM].toNumber();
        const correctResult = firstNumber + secondNumber;

        const thereAreSomeNaNs =
            Number.isNaN(firstNumber)
            || Number.isNaN(secondNumber)
            || Number.isNaN(sumNumber)
            || Number.isNaN(correctResult);
        const $resultElement = $('#result');
        if (thereAreSomeNaNs) $resultElement.innerHTML = `<span>Oops... use numbers only!</span>`;
        else $resultElement.innerHTML = sumNumber !== correctResult
            ? `<span class="wrong">Wrong answer! Correct: ${correctResult}</span>`
            : `<span class="correct">Hooray! Your answer is correct!</span>`;

        finallyShowLastStep2();
    }

    function finallyShowLastStep2() {
        $step2Section.toggleClassDisplayNone();
    }

    function onClearAndReplay() {
        [$step1Section, $step2Section].forEach(element => element.toggleClassDisplayNone());

        [$firstOperandInput, $secondOperandInput, $sumInput].forEach(element => {
            element.unsetDisabled();
            element.setBlankValue();
        });

        Object.keys(keys).forEach(key => values[key] = '');

        $firstOperandInput.focus();
    }
}
