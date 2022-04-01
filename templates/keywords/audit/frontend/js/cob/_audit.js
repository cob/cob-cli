//----------------- $audit  ------------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances((instance, presenter) => 
    {
        let userFPs = presenter.findFieldPs( fp => /[$]audit\.(creator|updater)\.(username|uri|time)/.exec(fp.field.fieldDefinition.description) )
        userFPs.forEach( fp => {
            fp.disable()
            if(fp.getValue() && (!instance.isNew() || presenter.isGroupEdit())) return //Don't do nothing if field is not empty AND it's an update interface (updates will only be changed by the backend)
            if(/[$]audit\.(creator|updater)\.username/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUser())
            }
            if(/[$]audit\.(creator|updater)\.uri/.exec(fp.field.fieldDefinition.description)) {
                fp.setValue(core.getCurrentLoggedInUserUri())
            }
            if(/[$]audit\.(creator|updater)\.time/.exec(fp.field.fieldDefinition.description)) {               
                fp.setValue(Date.now())
                setInterval(() =>  fp.setValue(Date.now()),15000)
            }
        })
    })
});