//--------------- $group apenas com $references assumem 'nome' do $references ---------------------
// Use $style[use-reference-count] on the containing $group that you want to have the result
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        var mo = new MutationObserver(function (mutations) {
            mutations.forEach( m => {
                let group = $(m.target).parentsUntil(".field-group.custom-use-reference-count").parent().find(".group-name")
                let labelHTML = $(m.target).parent()[0].innerHTML
                group[0].innerHTML = labelHTML.substring(0,labelHTML.indexOf("<div"))
                $(m.target).parent().hide()
            })
        });

        let references = $('.field-group.custom-use-reference-count > ol > li > div > div.references-legend').toArray()
        references.forEach( reference => {
            mo.observe(reference, { childList: true, subtree: true });
        }) 
    })
})