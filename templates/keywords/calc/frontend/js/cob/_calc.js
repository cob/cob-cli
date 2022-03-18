//----------------- Enable do $calc  ------------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances((instance, presenter) => calc_automation(instance, presenter))
});

function calc_automation(instance, presenter) {
    registerAndExecuteCalculation()

    //=========================================================
    // Support functions
    //=========================================================
    function registerAndExecuteCalculation() {
        registerExecuteCalculationsOnChanges()
        executeCalculations()
    }

    //=========================================================
    function getAllCalculationsFields() {
        return presenter
            .findFieldPs( fp => /[$]calc\.(.*)/.exec(fp.field.fieldDefinition.description) )
            .map( calculationFp => {
                calculationFp.disable()
                return {
                    fp: calculationFp,
                    op: getCalculationOperation(calculationFp),
                    args: getCalculationArguments(calculationFp)
                }
            })

        //=========================================================
        function getCalculationOperation(calculationFp) {
            let fieldDescription = calculationFp.field.fieldDefinition.description
            let expr = fieldDescription.substr(fieldDescription.indexOf("$calc.")+6)
            let matcher = /([^(]+)/
            let op = expr.match(matcher)[1]
            return op
        }

        //=========================================================
        function getCalculationArguments(calculationFp) {
            let argNames = getCalculationArgNames(calculationFp)
            return argNames
                .map( argName => isNaN(argName)
                    ? getAllAplicableFpsForVarName(calculationFp, argName) // É uma variável, retorna todos os fp associados
                    : argName * 1 // é uma constante numérica
                )
                .flat()

            //=========================================================
            function getCalculationArgNames(calculationFp) {
                let fieldDescription = calculationFp.field.fieldDefinition.description;
                let expr = fieldDescription.substr( fieldDescription.indexOf("$calc.") + 6 );
                let matcher = /[^(]+\(([^(]+)\)/;
                let argNamesArray = expr.match(matcher)[1].split(",");
                return argNamesArray;
            }

            //=========================================================
            function getAllAplicableFpsForVarName(calculationFp, varName) {
                let result
                 if(varName === "previous") {
                    let todosCampos = presenter.findFieldPs(() => true).map(fp => fp.field.id )
                    result = presenter.findFieldPs(fp => fp.field.id === todosCampos[todosCampos.indexOf(calculationFp.field.id)-1])
                } else {
                    result = presenter.findFieldPs( fp => fp.field.fieldDefinition.description && fp.field.fieldDefinition.description.includes("$"+varName))
                }
                return result
            }
        }
    }

    //=========================================================
    function registerExecuteCalculationsOnChanges() {
        let calculations = getAllCalculationsFields()
        // eventos de field changes de qualquer das variáveis (ou seja, sempre que o argumento não for um número)
        calculations.forEach(
            calculation => calculation.args.forEach( arg => {
                if(isNaN(arg)) {
                    if(arg.field.fieldDefinition.duplicable) {
                        //O caso de campos duplicáveis é diferente porque é necessário voltar a registar tudo e só depois calcular
                        presenter.onFieldChange(arg.field.fieldDefinition.name, () => registerAndExecuteCalculation() )
                    } else {
                        //No caso de campos normais só é necessário calcular tudo quando uma dependência muda
                        presenter.onFieldChange(arg, () => executeCalculations() )
                    }
                }
            })
        )
    }

    //=========================================================
    function executeCalculations() {
        console.group("[Calculations] eval all $calc");
        let calculations = getAllCalculationsFields() // Get fresh values
        let t0 = performance.now();
        calculations.forEach( calculation => {
            let t0parcial = performance.now();
            let novoResultado = "" + evaluateExpression(calculation)
            if(calculation.fp.getValue() != novoResultado ) {
                calculation.fp.setValue(novoResultado)
                console.groupCollapsed("[Calculations] updated field ", calculation.fp.field.fieldDefinition.id, " '", calculation.fp.field.fieldDefinition.name, "' with ",novoResultado)
                console.debug("[Calculations]", calculation.op)
                console.debug("[Calculations]", calculation.args.map(arg => isNaN(arg) ? arg.field.fieldDefinition : arg))
                console.debug("[Calculations] subcalc took " + (performance.now() - t0parcial) + " milliseconds.");
                console.groupEnd()

            }
        })
        console.debug("[Calculations] total calc took " + (performance.now() - t0) + " milliseconds.");
        console.groupEnd();
        return ;

        //=========================================================
        function evaluateExpression(calculation) {
            // Obter valores para variaveis
            let values = calculation.args.map(arg =>
                arg.getValue
                ? isNaN(arg.getValue() * 1)
                    ? 0
                    : parseFloat(arg.getValue())
                : arg
            );

            // Realizar operação
            let resultado = new BigDecimal(0)
            if (calculation.op === "multiply" && values.length > 0) {
                resultado = new BigDecimal(1);
                values.forEach(value => resultado = resultado.multiply(new BigDecimal(value)))

            } else if (calculation.op === "divide" && values.length === 2 && values[1] !== 0 ) {
                resultado = new BigDecimal(values[0]);
                resultado = resultado.divide(new BigDecimal(values[1]))

            } else if (calculation.op === "sum") {
                values.forEach(value => resultado = resultado.add(new BigDecimal(value)))

            } else if (calculation.op === "subtract" && values.length === 2) {
                resultado = new BigDecimal(values[0]);
                resultado = resultado.subtract(new BigDecimal(values[1]))
            }
            return resultado
        }
    }
}

// From https://stackoverflow.com/questions/16742578/bigdecimal-in-javascript
class BigDecimal {
    // Configuration: constants
    static DECIMALS = 8; // number of decimals on all instances
    static ROUNDED = true; // numbers are truncated (false) or rounded (true)
    static SHIFT = BigInt("1" + "0".repeat(BigDecimal.DECIMALS)); // derived constant
    constructor(value) {
        if (value instanceof BigDecimal) return value;
        let [ints, decis] = String(value).split(".").concat("");
        this._n = BigInt(ints + decis.padEnd(BigDecimal.DECIMALS, "0")
                                     .slice(0, BigDecimal.DECIMALS)) 
                  + BigInt(BigDecimal.ROUNDED && decis[BigDecimal.DECIMALS] >= "5");
    }
    static fromBigInt(bigint) {
        return Object.assign(Object.create(BigDecimal.prototype), { _n: bigint });
    }
    add(num) {
        return BigDecimal.fromBigInt(this._n + new BigDecimal(num)._n);
    }
    subtract(num) {
        return BigDecimal.fromBigInt(this._n - new BigDecimal(num)._n);
    }
    static _divRound(dividend, divisor) {
        return BigDecimal.fromBigInt(dividend / divisor 
            + (BigDecimal.ROUNDED ? dividend  * 2n / divisor % 2n : 0n));
    }
    multiply(num) {
        return BigDecimal._divRound(this._n * new BigDecimal(num)._n, BigDecimal.SHIFT);
    }
    divide(num) {
        return BigDecimal._divRound(this._n * BigDecimal.SHIFT, new BigDecimal(num)._n);
    }
    toString() {
        const s = this._n.toString().padStart(BigDecimal.DECIMALS+1, "0");
        const decimals = s.slice(-BigDecimal.DECIMALS).replace(/\.?0+$/, "")
        return s.slice(0, -BigDecimal.DECIMALS) + (decimals ? ".":"") + decimals;
    }
}
