//--------------- $group apenas com $references assumem 'nome' do $references ---------------------
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        var mo = new MutationObserver(function (mutations) {
            mutations.forEach( m => {
                let group = $(m.target).parentsUntil(".field-group").parent().find(".group-name")
                let labelHTML = $(m.target).parent()[0].innerHTML
                group[0].innerHTML = labelHTML.substring(0,labelHTML.indexOf("<div"))
            })
        });

        let references = $('.field-group > ol > li > div > div.references-legend').toArray()
        references.forEach( reference => {
            mo.observe(reference, { childList: true, subtree: true });
        }) 
    })
})