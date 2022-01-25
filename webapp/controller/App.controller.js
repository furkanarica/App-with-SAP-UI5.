sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/model/json/JSONModel",
    "sap/ui/model/resource/ResourceModel",
    "sap/m/MessageBox",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"

], function (Controller, MessageToast, JSONModel, ResourceModel, MessageBox, Filter, FilterOperator) {
    "use strict";

    var staffLineup = {
        "personnel": []
    }

    var databaseObj = openDatabase("per222222ssfelDatabase", 1.0, "Personnels Database", 2 * 1024 * 1024)

    databaseObj.transaction(function (tx) {
        tx.executeSql("CREATE TABLE IF NOT EXISTS PERSONNELS (id INTEGER PRIMARY KEY,Name,Surname,PhoneNumber,PhotoUrl)");

    })


    return Controller.extend("sap.ui.demo.walkthrough.controller.App", {
        onInit: function () {
            // set data model on view
            var oData = {
                recipient: {
                    name: "World"
                }
            };
            var oModel = new JSONModel(oData);
            this.getView().setModel(oModel);


            var i18nModel = new ResourceModel({
                bundleName: "sap.ui.demo.walkthrough.i18n.i18n"
            });
            this.getView().setModel(i18nModel, "i18n");

            var personData = {
                pName: "",
                pSurname: "",
                pNumber: "",
                pPhoto: ""
            }

            oModel.setProperty("/personData", personData)

            var deleteId = this.byId("deleteButton")
            var editId = this.byId("editButton")
            databaseObj.transaction(function (tx) {
                tx.executeSql("SELECT*FROM PERSONNELS", [], (tx, result) => {
                    for (let index = 0; index < result.rows.length; index++) {
                        staffLineup.personnel.push({
                            pName: result.rows.item(index).Name,
                            pSurname: result.rows.item(index).Surname,
                            pNumber: result.rows.item(index).PhoneNumber,
                            pPhoto: result.rows.item(index).PhotoUrl,
                            pId: result.rows.item(index).id
                        })
                        oModel.setProperty("/personnel", staffLineup.personnel)
                    }
                    if (result.rows.length > 0) {
                        deleteId.setVisible(true)
                        editId.setVisible(true)
                    }
                })
            })

        },

        onSavePress: function () {
            var oModel = this.getView().getModel()
            var fileUploader = this.byId("fileUploader");

            var controlName = oModel.getProperty("/personData/pName")
            var controlSurname = oModel.getProperty("/personData/pSurname")
            var controlNumber = oModel.getProperty("/personData/pNumber")
            var controlPhoto = fileUploader.mProperties.value
            var photo = oModel.getProperty("/personData/pPhoto")


            if (controlName != "" && controlSurname != "" && controlNumber != "" && controlPhoto) {
                databaseObj.transaction(function (tx) {
                    tx.executeSql("INSERT INTO PERSONNELS(Name,Surname,PhoneNumber,PhotoUrl) VALUES (?,?,?,?)",
                        [controlName, controlSurname, controlNumber, photo],
                        (tx, result) => {
                            staffLineup.personnel.push({
                                pName: oModel.getProperty("/personData/pName"),
                                pSurname: oModel.getProperty("/personData/pSurname"),
                                pNumber: oModel.getProperty("/personData/pNumber"),
                                pPhoto: oModel.getProperty("/personData/pPhoto"),
                                pId: result.insertId
                            })
                            oModel.setProperty("/personnel", staffLineup.personnel)
                            oModel.setProperty("/personData/pName", "")
                            oModel.setProperty("/personData/pSurname", "")
                            oModel.setProperty("/personData/pNumber", "")
                            oModel.setProperty("/personData/pPhoto", "")
                        },
                        (tx, result) => {
                        })
                })


                MessageToast.show("Personnel Added");
            } else {
                MessageBox.error("All information must be entered.");

                oModel.setProperty("/personData/pName", "")
                oModel.setProperty("/personData/pSurname", "")
                oModel.setProperty("/personData/pNumber", "")
                oModel.setProperty("/personData/pPhoto", "")
            }
            this.byId("editButton").setVisible(true)
            this.byId("deleteButton").setVisible(true)
            fileUploader.clear();
        },

        onDeletePress: function () {
            var oModel = this.getView().getModel()
            this.byId("staffList").setMode("Delete")
            this.byId("editButton").setVisible(false)
            this.byId("deleteButton").setVisible(false)
            this.byId("cancelDelete").setVisible(true)
            this.byId("saveButton").setVisible(false)
            this.byId("clearButton").setVisible(false)

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")
            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();
        },

        onCancelDeletePress: function () {
            var oModel = this.getView().getModel()

            this.byId("editButton").setVisible(true)
            this.byId("deleteButton").setVisible(true)
            this.byId("saveButton").setVisible(true)
            this.byId("clearButton").setVisible(true)

            this.byId("staffList").setMode("None")
            this.byId("cancelDelete").setVisible(false)
            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")
            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();

        },

        handleDelete: function (oEvent) {
            var oModel = this.getView().getModel()
            var context = oEvent.getParameter("listItem").getBindingContext().getPath().split("/")[2];

            var oSelected = oEvent.getParameter("listItem").getBindingContext()
            var oSelectedPath = oSelected.sPath
            var oSelectedItems = oModel.getProperty(oSelectedPath)
            var deleteValue = oSelectedItems.pId

            databaseObj.transaction(function (tx) {
                tx.executeSql("DELETE FROM PERSONNELS WHERE id=?",
                    [deleteValue],
                    (tx, result) => {
                        staffLineup.personnel.splice(context, 1)
                        oModel.setProperty("/personnel", staffLineup.personnel)
                    },
                    (tx, result) => {
                    })

            })

            if (staffLineup.personnel.length > 1) {
                this.byId("cancelDelete").setVisible(false)
                this.byId("clearButton").setVisible(true)
                this.byId("saveButton").setVisible(true)
                this.byId("editButton").setVisible(true)
                this.byId("deleteButton").setVisible(true)
                this.byId("staffList").setMode("None")
            } else {
                this.byId("saveButton").setVisible(true)
                this.byId("clearButton").setVisible(true)
                this.byId("cancelDelete").setVisible(false)
                this.byId("staffList").setMode("None")
                this.byId("saveButton").setVisible(true)
                this.byId("editButton").setVisible(false)
            }

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")
            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();

            MessageToast.show("Personnel Deleted");

        },

        onEditPress: function () {
            var oModel = this.getView().getModel()
            this.byId("saveButton").setVisible(false)
            this.byId("clearButton").setVisible(false)
            this.byId("editButton").setVisible(false)
            this.byId("clearButton").setVisible(false)
            this.byId("deleteButton").setVisible(false)
            this.byId("staffList").setMode("SingleSelect")
            this.byId("cancelEdit").setVisible(true)

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")

            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();


        },

        onCancelEditPress: function () {
            var oModel = this.getView().getModel()
            this.byId("cancelEdit").setVisible(false)
            this.byId("saveButton").setVisible(true)
            this.byId("clearButton").setVisible(true)
            this.byId("editButton").setVisible(true)
            this.byId("deleteButton").setVisible(true)

            this.byId("staffList").setMode("None")

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")

            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();
        },

        SingleSelect: function (oEvent) {
            var oModel = this.getView().getModel()
            var oSelected = this.byId("staffList").getSelectedItem()

            var selectName = oSelected.mBindingInfos.title.binding.aValues[0];
            var selectSurname = oSelected.mBindingInfos.title.binding.aValues[1];
            var selectNumber = oSelected.mBindingInfos.description.binding.oValue;

            oModel.setProperty("/personData/pName", selectName)
            oModel.setProperty("/personData/pSurname", selectSurname)
            oModel.setProperty("/personData/pNumber", selectNumber)

            this.byId("cancelEdit").setVisible(false)
            this.byId("saveEdit").setVisible(true)
            this.byId("exitEdit").setVisible(true)

            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();

        },

        onExitEditPress: function () {
            var oModel = this.getView().getModel()
            this.byId("cancelEdit").setVisible(true)
            this.byId("saveEdit").setVisible(false)
            this.byId("exitEdit").setVisible(false)

            this.byId("staffList").setMode("None")
            this.byId("staffList").setMode("SingleSelect")

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")

            var fileUploader = this.byId("fileUploader");
            fileUploader.clear();

        },

        onSaveEditPress: function () {
            var oModel = this.getView().getModel()
            var fileUploader = this.byId("fileUploader");
            this.byId("cancelEdit").setVisible(true)
            this.byId("saveEdit").setVisible(false)
            this.byId("exitEdit").setVisible(false)

            var oSelected = this.byId("staffList").getSelectedItem()
            var oSelectedPath = oSelected.oBindingContexts.undefined.sPath
            var personData = oModel.getProperty("/personData")
            var oSelectedItems = oModel.getProperty(oSelectedPath)

            var editId = oSelectedItems.pId

            var controlName = oModel.getProperty("/personData/pName")
            var controlSurname = oModel.getProperty("/personData/pSurname")
            var controlNumber = oModel.getProperty("/personData/pNumber")
            var controlPhoto = fileUploader.mProperties.value
            var photo = oModel.getProperty("/personData/pPhoto")

            oModel.setProperty("/personData/pId", editId)

            if (controlName != "" && controlSurname != "" && controlNumber != "" && controlPhoto != "") {
                oModel.setProperty("/personData", oSelectedItems)
                oModel.setProperty(oSelectedPath, personData)
                this.byId("staffList").setMode("None")
                this.byId("staffList").setMode("SingleSelect")
                MessageToast.show("Personnel Data Updated");

                databaseObj.transaction(function (tx) {
                    tx.executeSql("UPDATE PERSONNELS SET Name=?, Surname=?, PhoneNumber=?,PhotoUrl=? WHERE id=?", [controlName, controlSurname, controlNumber, photo, editId])

                })

            } else {
                MessageBox.error("All information must be entered.");
                this.byId("staffList").setMode("None")
                this.byId("staffList").setMode("SingleSelect")
            }

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")

            fileUploader.clear();
        },

        onChangeFile: function (oEvent) {
            var oModel = this.getView().getModel()
            var oReader = new FileReader();

            oReader.onload = function () {
                oModel.setProperty("/personData/pPhoto", oReader.result)
            }
            oReader.readAsDataURL(oEvent.getParameter("files")[0]);
        },

        onClearButtonPress: function () {
            var oModel = this.getView().getModel()
            var fileUploader = this.byId("fileUploader");

            oModel.setProperty("/personData/pName", "")
            oModel.setProperty("/personData/pSurname", "")
            oModel.setProperty("/personData/pNumber", "")
            oModel.setProperty("/personData/pPhoto", "")

            fileUploader.clear();

        },

        onFilterInvoices: function (oEvent) {
            var aFilter = [];
            var sQuery = oEvent.getParameter("query");
            if (sQuery) {
                aFilter.push(new Filter("pSurname", FilterOperator.Contains, sQuery));
            }

            var oList = this.byId("staffList");
            var oBinding = oList.getBinding("items");
            oBinding.filter(aFilter);
        }
    });
});
