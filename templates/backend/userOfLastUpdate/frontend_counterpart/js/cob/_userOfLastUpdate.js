//----------------- $user  ------------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances((instance, presenter) => 
    {
        let userFPs = presenter.findFieldPs( fp => /[$]user\.(creator|updater)\(username|usermRef\)/.exec(fp.field.fieldDefinition.description && fp.field.fieldDefinition.description) )
        userFPs.forEach( fp => {
            fp.disable()
            if(!instance.isNew() || presenter.isGroupEdit()) return //Only update if it's on create interface (updates will only be changed by the backend)
            if(/[$]user\.(creator|updater)\(username\)/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUser())
            }
            if(/[$]user\.(creator|updater)\(usermRef\)/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUserUri())
            }
        })
    })
});