//--------------- $group apenas com $references assumem 'nome' do $references ---------------------
// Use $style[use-reference-count] on the containing $group that you want to have the result
cob.custom.customize.push(function (core, utils, ui) {
    core.customizeAllInstances(function(instance, presenter) {
        const update = (div) => {
            let group = $(div).parentsUntil(".field-group.custom-use-reference-count").parent().find(".group-name")
            let groupName = (group[0].children.length ? group[0].children[0].innerHTML : group[0].innerHTML).trim()
            let labelHTML = $(div).parent()[0].innerHTML
            let labelWithCount = labelHTML.substring(0,labelHTML.indexOf("<div"))
            //Apenas muda o texto se o nome do $group for o mesmo que o do campo $references
            //isto permite escolher qual o references a mostrar 
            if(labelWithCount.indexOf(" <span>"+groupName+"</span>") == 0) {
                group[0].innerHTML = labelWithCount
                $(m.target).parent().parent().hide()
            }
        }
        var mo = new MutationObserver( (mutations) => mutations.forEach( m => update(m.target)) );

        let references = $('.field-group.custom-use-reference-count > ol > li:not(.hidden) > div > div.references-legend').toArray()
        references.forEach( reference =>  mo.observe(reference.children[1], { childList: true }) );
    })
})