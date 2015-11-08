Ext.onReady(function() {
    var params = Ext.Object.fromQueryString(location.search);
    
    Ext.create('Ext.container.Viewport', {
        layout: 'fit',
        items: [
            {
                xtype: 'panel',
                title: 'Form Tools',
                layout: { type: 'vbox', align: 'stretch', pack: 'start' },
                items: [
                    {
                        xtype: 'form',
                        padding: 20,
                        border: 0,
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Key',
                                name: 'oauth_token',
                                allowBlank: false,
                                value: params.key
                            }
                        ],
                        buttons: [
                            {
                                text: 'Reset',
                                handler: function() {
                                    this.up('form').getForm().reset();
                                }
                            },
                            {
                                text: 'Submit',
                                formBind: true,
                                disabled: true,
                                handler: function() {
                                    var form = this.up('form').getForm();
                                    if (form.isValid()) {
                                        Ext.Ajax.request({
                                            url: 'https://www.formstack.com/api/v2/form.json?oauth_token=6891c7a91d07a546bba0a3decd320913',
                                            extraParams: form.getValues(),
                                            cors: true,
                                            success: function(response, opts) {
debugger;
                                            },
                                            failure: function(response, opts) {
debugger;
                                            }
                                        });
                                    }
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'grid',
                        flex: 1,
                        padding: 20,
                        store: Ext.create('Ext.data.Store', {
                            fields: [ 'id' ]
                        }),
                        columns: [
                            {
                                text: 'ID',
                                dataIndex: 'id'
                            }
                        ]
                    }
                ]
            }
        ]
    });
});