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
                        itemId: 'formDataForm',
                        padding: 20,
                        border: 0,
                        items: [
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Key',
                                name: 'oauth_token',
                                allowBlank: false,
                                value: params.key
                            },
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Form',
                                name: 'form',
                                allowBlank: false,
                                value: params.form
                            },
                            {
                                xtype: 'textfield',
                                fieldLabel: 'Form',
                                name: 'encryption_password',
                                allowBlank: false,
                                inputType: 'password',
                                value: params.encpw
                            },
                            {
                                xtype: 'hidden',
                                name: 'data',
                                value: true
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
                                text: 'Load Submissions',
                                formBind: true,
                                disabled: true,
                                handler: function() {
                                    var form = this.up('form').getForm(),
                                        vp = Ext.ComponentQuery.query('viewport')[0];
                                    if (form.isValid()) {
                                        var vals = form.getValues();
                                        vp.getEl().mask('Loading...');
                                        Ext.Ajax.request({
                                            url: 'https://www.formstack.com/api/v2/form/' + vals.form + '/submission.json',
                                            params: vals,
                                            method: 'GET',
                                            cors: true,
                                            success: function(response, opts) {
                                                var d = Ext.decode(response.responseText),
                                                    fields = getFormFields(vals.form);
                                                Ext.each(d.submissions, function(submission, i) {
                                                    d.submissions[i].last_name = submission.data[fields['patient_last_name']].value;
                                                    d.submissions[i].first_name = submission.data[fields['patient_first_name']].value;
                                                    d.submissions[i].middle_name = submission.data[fields['patient_middle_name']].value;
                                                    d.submissions[i].date = submission.data[fields['form_date']].value;
                                                });
                                                Ext.ComponentQuery.query('#formDataGrid')[0].getStore().loadData(d.submissions);
                                                vp.getEl().unmask();
                                            },
                                            failure: function(response, opts) {
                                                Ext.MessageBox.alert('Error', 'Failed to get form information.');
                                                vp.getEl().unmask();
                                            }
                                        });
                                    }
                                }
                            }
                        ]
                    },
                    {
                        xtype: 'grid',
                        itemId: 'formDataGrid',
                        forceFit: true,
                        flex: 1,
                        padding: 20,
                        store: Ext.create('Ext.data.Store', {
                            fields: [ 'id', 'last_name', 'first_name', 'middle_name', 'date', 'timestamp', 'data' ],
                            sorters: [
                                { property: 'timestamp', direction: 'DESC' }
                            ]
                        }),
                        tbar: [
                            {
                                text: 'View',
                                requiresSelection: true,
                                disabled: true,
                                handler: function() {
                                    var vp = Ext.ComponentQuery.query('viewport')[0],
                                        vals = Ext.ComponentQuery.query('#formDataForm')[0].getValues(),
                                        data = buildFieldData(getFormFields(vals.form), this.selRecs[0].get('data')),
                                        url = (vals.form.substr(-2) === '15' ? 'registration-form.html' : 'health-history-form.html') + '?data=' + encodeURIComponent(Ext.encode(data));
                                    window.open(url);
                                    /*new Ext.Window({
                                        title: 'View Submission',
                                        width: vp.getWidth() * 0.9,
                                        height: vp.getHeight() * 0.9,
                                        layout: 'fit',
                                        maximizable: true,
                                        modal: true,
                                        tbar: [
                                            {
                                                text: 'Print',
                                                handler: function() {
                                                    var frame = this.up('window').getComponent(0).getEl().dom.contentWindow;
                                                    frame.focus();
                                                    frame.print();
                                                }
                                            }
                                        ],
                                        items: [
                                            {
                                                xtype: 'component',
                                                autoEl: {
                                                    tag: 'iframe',
                                                    src: url,
                                                    'data-bind': 'bindIframe: $data'
                                                }
                                            }
                                        ]
                                    }).show();*/
                                }
                            },
                            {
                                text: 'Delete',
                                requiresSelection: true,
                                disabled: true,
                                handler: function() {
                                    var vp = Ext.ComponentQuery.query('viewport')[0],
                                        s = this.up('grid').getStore(),
                                        vals = Ext.ComponentQuery.query('#formDataForm')[0].getValues();
                                    
                                    Ext.MessageBox.confirm('Delete', 'Are you sure you want to delete ' + (this.selRecs.length > 1 ? 'these' : 'this') + ' submission' + (this.selRecs.length > 1 ? 's' : '') + '?', function(resp) {
                                        if (resp === 'yes') {
                                            vp.getEl().mask('Deleting...');
                                            Ext.each(this.selRecs, function(sel) {
                                                Ext.Ajax.request({
                                                    url: 'https://www.formstack.com/api/v2/submission/' + sel.get('id') + '.json?oauth_token=' + vals.oauth_token,
                                                    method: 'DELETE',
                                                    cors: true,
                                                    success: function(response, opts) {
                                                        s.remove(sel);
                                                        vp.getEl().unmask();
                                                    },
                                                    failure: function(response, opts) {
                                                        Ext.MessageBox.alert('Error', 'Failed to delete form submission.');
                                                        vp.getEl().unmask();
                                                    }
                                                });
                                            });
                                        }
                                    });
                                }
                            }
                        ],
                        columns: [
                            {
                                text: 'Date Submitted',
                                dataIndex: 'date'
                            },
                            {
                                text: 'First Name',
                                dataIndex: 'first_name'
                            },
                            {
                                text: 'Middle Name',
                                dataIndex: 'middle_name'
                            },
                            {
                                text: 'Last Name',
                                dataIndex: 'last_name'
                            }
                        ],
                        listeners: {
                            selectionchange: function(g, selected) {
                                Ext.each(this.query('[requiresSelection]'), function(b) {
                                    b[selected.length ? 'enable' : 'disable']();
                                    b.selRecs = selected;
                                });
                            }
                        }
                    }
                ]
            }
        ]
    });
    
    function getFormFields(form) {
        if (form.substr(-2) === '15') {
            return {
                todays_date: 37223250,
                patient_last_name: 37223607,
                pcp: 37223633,
                patient_first_name: 37223642,
                patient_middle_name: 37223645,
                marital_status: 37223647,
                is_legal_name: 37223689,
                legal_name: 37223697,
                former_name: 37223722,
                patient_birth_date: 37223725,
                patient_age: 37223738,
                patient_sex: 37223750,
                patient_ssn: 37223922,
                patient_home_phone: 37223935,
                patient_cell_phone: 37223937,
                patient_occupation: 37223944,
                patient_employer: 37223945,
                patient_employer_phone_number: 37223946,
                why_choose_clinic: 37223947,
                other_family_members_seen: 37224101,
                bill_name: 37224112,
                bill_birth_date: 37224124,
                bill_home_phone: 37224136,
                bill_is_patient: 37224139,
                bill_has_insurance: 37224140,
                primary_insurance: 37224141,
                primary_insurance_other: 37224142,
                primary_subscribers_name: 37224143,
                primary_subscribers_ssn: 37224144,
                primary_subscribers_birth_date: 37224156,
                primary_subscribers_group_no: 37224157,
                primary_subscribers_policy_no: 37224159,
                primary_subscribers_co_payment: 37224161,
                relationship_to_primary_subscriber: 37224162,
                relationship_to_primary_subscriber_other: 37224164,
                secondary_insurance: 37224165,
                secondary_subscribers_name: 37224166,
                secondary_subscribers_group_no: 37224167,
                secondary_subscribers_policy_no: 37224169,
                emergency_name: 37224174,
                emergency_relationship: 37224175,
                emergency_home_phone: 37224176,
                emergency_work_phone: 37224177,
                signature: 37224179,
                form_date: 37224189,
                patient_address: 37224229,
                bill_address: 37224231
            };
        } else {
            return {
                
            };
        }
    }
    
    function buildFieldData(fields, data) {
        var fieldData = {};
        for (var field in fields) {
            if (fields[field] && data[fields[field]]) {
                fieldData[field] = data[fields[field]].value;
            } else {
                console.log(field);
                fieldData[field] = '';
            }
        }
        return fieldData;
    }
});