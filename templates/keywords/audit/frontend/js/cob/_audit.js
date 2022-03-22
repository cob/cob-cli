//----------------- $audit  ------------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances((instance, presenter) => 
    {
        let userFPs = presenter.findFieldPs( fp => /[$]audit\.(creator|updater)\.(username|usermURI|time)/.exec(fp.field.fieldDefinition.description) )
        userFPs.forEach( fp => {
            fp.disable()
            if(!instance.isNew() || presenter.isGroupEdit()) return //Only update if it's on create interface (updates will only be changed by the backend)
            if(/[$]audit\.(creator|updater)\.username/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUser())
            }
            if(/[$]audit\.(creator|updater)\.usermURI/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUserUri())
            }
            if(/[$]audit\.(creator|updater)\.time/.exec(fp.field.fieldDefinition.description)) {               
                fp.setValue(Date.now())
            }
        })
    })
});