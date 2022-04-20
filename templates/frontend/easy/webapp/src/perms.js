export default {
   userm: [
      {
         domain: 'module',
         actions: [{
            name: 'view',
            entities:[
               { name: 'group'              } ,
               { name: 'role'               } ,
               { name: 'permission'         } ,
               { name: 'create.user'        } ,
               { name: 'details.user'       } ,
               { name: 'create.group'       } ,
               { name: 'details.group'      } ,
               { name: 'create.role'        } ,
               { name: 'details.role'       } ,
               { name: 'create.permission'  } ,
               { name: 'details.permission' } ,
               { name: 'custom-resource'    }
            ]
         }]
      },
      {
         domain: 'user',
         actions: [
            { name: 'create'            } ,
            { name: 'read'              } ,
            { name: 'update'            } ,
            { name: 'delete'            } ,
            { name: 'assign-substitute' }
         ]
      },
      {
         domain: 'group',
         actions: [
            { name: 'create'      } ,
            { name: 'read'        } ,
            { name: 'update'      } ,
            { name: 'delete'      } ,
            { name: 'add-user'    } ,
            { name: 'add-role'    } ,
            { name: 'remove-user' } ,
            { name: 'remove-role' }
         ]
      },
      {
         domain: 'role',
         actions: [
            { name: 'create'            } ,
            { name: 'read'              } ,
            { name: 'update'            } ,
            { name: 'delete'            } ,
            { name: 'add-permission'    } ,
            { name: 'remove-permission' }
         ]
      },
      {
         domain: 'permission',
         actions: [
            { name: 'create'            } ,
            { name: 'read'              } ,
            { name: 'update'            } ,
            { name: 'delete'            }
         ]
      },
   ],

   confm: [
      {
         domain: 'module',
         actions: [{
            name: 'view',
            entities:[
               { name: 'dashboard '      },
               { name: 'search '         },
               { name: 'cpedetails '     },
               { name: 'cpestatus '      },
               { name: 'bulkcommands'    },
               { name: 'jobs '           },
               { name: 'jobdetails '     },
               { name: 'jobstatus '      },
               { name: 'templates '      },
               { name: 'reports '        },
               { name: 'reportdetail'    },
               { name: 'custom-resource' }
            ]
         }]
      },
      {
         domain: 'equips',
         actions: [
            { name: 'create'        },
            { name: 'read'          },
            { name: 'update'        },
            { name: 'delete'        },
            { name: 'import'        },
            { name: 'configuration' },
            { name: 'command'       }
         ]
      },
      {
         domain: 'jobreqs',
         actions: [ { name: 'read' } ]
      },
      {
         domain: 'templates',
         actions: [
            { name: 'read'        },
            { name: 'update'      },
            { name: 'generate'    },
            { name: 'zonereorder' },
            { name: 'zonedelete'  }
         ]
      }
   ],

   recordm: [
      {
         domain: 'module',
         help: '',
         actions: [{
            name: 'view',
            help: '',
            entities:[
               { name: 'domains'           } ,
               { name: 'definition.create' } ,
               { name: 'definition.edit'   } ,
               { name: 'search-domain'     } ,
               { name: 'search-definition' } ,
               { name: 'instance.create'   } ,
               { name: 'instance.detail'   } ,
               { name: 'instance.duplicate'} ,
               { name: 'instance.groupedit'} ,
               { name: 'reports'           } ,
               { name: 'reportdetail'      } ,
               { name: 'custom-resource'   }
            ]
         }]
      },
      {
         domain: 'view',
         actions: [{name: 'share'}]
      },
      {
         domain: 'domains',
         actions: [
            { name: 'create'},
            { name: 'read', entities: [{ type: 'RM-DOMAIN-ID' }] },
            { name: 'update' },
            { name: 'delete' }
         ]
      },
      {
         domain: 'definitions',
         actions: [
            { name: 'create' },
            { name: 'read'        , entities: [{ type: 'RM-DEF' }]},
            { name: 'instantiate' , entities: [{ type: 'RM-DEF' }] ,  help: 'para criar novas instâncias'},
            { name: 'update' },
            { name: 'delete' },
            { name: 'bulkrequest' , entities: [{ type: 'RM-DEF' }] ,  help: ''},
            { name: 'instance.add-log'           ,  help: ''},
            { name: 'instance.validate-for-user' ,  help: ''}
         ]
      },
      {
         domain: 'instances',
         actions: [
            { name: 'read'  , entities: [{ type: 'RM-DEF' }]},
            { name: 'update', entities: [{ type: 'RM-DEF' }]},
            { name: 'delete', entities: [{ type: 'RM-DEF' }]},
            { name: 'import', entities: [{ type: 'RM-DEF' }]},
            { name: 'export', entities: [{ type: 'RM-DEF' }]}
         ]
      },
      {
         domain: 'tasks',
         actions: [
            { name: '*'       , entities: [{ type: 'RM-DEF' }]},
            { name: 'create'  , entities: [{ type: 'RM-DEF' }]},
            { name: 'assign'  , entities: [{ type: 'RM-DEF' }]},
            { name: 'complete', entities: [{ type: 'RM-DEF' }]},
            { name: 'delete'  , entities: [{ type: 'RM-DEF' }]}
         ]
      },
      {
         domain: 'workitem',
         help: 'para poder criar tarefas nos $tasklist',
         actions: [{ name: 'create' }]
      },
      {
         domain: 'process',
         help: 'para poder lançar processos nos $tasklist',
         actions: [{ name: 'instantiate' }]
      }
   ]
}
