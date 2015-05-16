/**
 * Helper functions:
 * @author Mark Macdonald
 * @copyright 2015 Nicholas C. Zakas. All rights reserved.
 * @copyright 2013 Mark Macdonald. All rights reserved.
 */

 /**
  * Inferred Method Name Rule:
  * @author Blake Johnston
  * @copyright 2015 Blake Johnston. All rights reserved.
  */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// none!

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

function isImplicitGlobal(variable) {
    return variable.defs.every(function(def) {
        return def.type === "ImplicitGlobalVariable";
    });
}

/**
 * Gets the declared variable, defined in `scope`, that `ref` refers to.
 * @param {Scope} scope The scope in which to search.
 * @param {Reference} ref The reference to find in the scope.
 * @returns {Variable} The variable, or null if ref refers to an undeclared variable.
 */
function getDeclaredGlobalVariable(scope, ref) {
    var declaredGlobal = null;
    scope.variables.some(function(variable) {
        if (variable.name === ref.identifier.name) {
            // If it's an implicit global, it must have a `writeable` field (indicating it was declared)
            if (!isImplicitGlobal(variable) || {}.hasOwnProperty.call(variable, "writeable")) {
                declaredGlobal = variable;
                return true;
            }
        }
        return false;
    });
    return declaredGlobal;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = function(context) {

    var NO_INFERRED_METHOD_MESSAGE = "\"{{name}}\" has no defined method name. Use syntax - foo: function foo {..}.";

    return {

        "Program:exit": function(/*node*/) {

            var globalScope = context.getScope();

            globalScope.through.forEach(function(ref) {
                var variable = getDeclaredGlobalVariable(globalScope, ref),
                    name = ref.identifier.name;

                /**
                 * Checks if the provided node is a call expression for a function
                 * Then checks to ensure that the parent function is part of an object literal
                 * Finally checks for undefined variable condition
                 * All conditions must be true to flag as a method inferrence error
                 */
                function isMethod (node) {
                    var nodeParentType = node.parent.type,
                        nodeParentParentParentType = node.parent.parent.parent.type;

                    if (nodeParentType === "CallExpression" && nodeParentParentParentType === "BlockStatement" && !variable) {
                        return true;
                    } else {
                        return false;
                    }
                }

                if (isMethod(ref.identifier)) {
                    context.report(ref.identifier, NO_INFERRED_METHOD_MESSAGE, { name: name });
                }

            });

        }

    };

};
