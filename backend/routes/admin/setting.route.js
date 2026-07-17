//express
const express = require("express");
const route = express.Router();

//checkAccessWithSecretKey
const checkAccessWithSecretKey = require("../../util/checkAccess");

//controller
const SettingController = require("../../controllers/admin/setting.controller");

//verify purchase code
function _0x1651(_0x8bcb27, _0x1f010c) {
  _0x8bcb27 = _0x8bcb27 - (-0x267e + 0x2d4 + 0x5 * 0x752);
  var _0x23b831 = _0x16e4();
  var _0x44933f = _0x23b831[_0x8bcb27];
  return _0x44933f;
}
function _0x16e4() {
  var _0x20d101 = [
    "9bkDbKN",
    "1556670iDiyBZ",
    "1527892teJTZs",
    "2862349WTPomg",
    "haseCode",
    "3FxBcun",
    "chaseCode",
    "get",
    "2GQJwUQ",
    "187TzpfOd",
    "verifyPurc",
    "630160XbaZSZ",
    "/verifyPur",
    "1852740optUKm",
    "1367436uYIduc",
    "5610416SaGuDv",
  ];
  _0x16e4 = function () {
    return _0x20d101;
  };
  return _0x16e4();
}
var _0x4bb45a = _0x1651;
((function (_0x1529b0, _0x783966) {
  var _0x21b300 = _0x1651,
    _0x57c4f5 = _0x1529b0();
  while (!![]) {
    try {
      var _0x259430 =
        (-parseInt(_0x21b300(0xf5)) / (-0x1327 + 0x709 + 0xc1f * 0x1)) * (parseInt(_0x21b300(0xf8)) / (-0x245d + 0x1129 * 0x2 + -0xaf * -0x3)) +
        (-parseInt(_0x21b300(0xf2)) / (0xc92 + -0x1b9f + 0xf10)) * (parseInt(_0x21b300(0xff)) / (0x16b * -0xb + -0x1 * 0x244a + 0x33e7)) +
        -parseInt(_0x21b300(0xfa)) / (-0x23b9 + 0x114b + 0x1273 * 0x1) +
        parseInt(_0x21b300(0xfb)) / (0x7 * -0x557 + -0x1858 + 0x1495 * 0x3) +
        -parseInt(_0x21b300(0xf0)) / (-0x99a + -0x2104 + 0x2aa5) +
        (parseInt(_0x21b300(0xfc)) / (-0x15b8 + -0x131c + 0x28dc)) * (-parseInt(_0x21b300(0xfd)) / (-0xfdd + 0x184c + -0x866)) +
        (-parseInt(_0x21b300(0xfe)) / (0x10d * 0x11 + -0x3 * -0xa13 + -0x300c)) * (-parseInt(_0x21b300(0xf6)) / (0x7d * 0x5 + 0xbc * 0x2a + -0x213e));
      if (_0x259430 === _0x783966) break;
      else _0x57c4f5["push"](_0x57c4f5["shift"]());
    } catch (_0x5223af) {
      _0x57c4f5["push"](_0x57c4f5["shift"]());
    }
  }
})(_0x16e4, 0x45451 + 0x79ba9 + 0x175 * -0x433),
  route[_0x4bb45a(0xf4)](_0x4bb45a(0xf9) + _0x4bb45a(0xf3), checkAccessWithSecretKey(), SettingController[_0x4bb45a(0xf7) + _0x4bb45a(0xf1)]));

//update setting
route.patch("/modifySetting", checkAccessWithSecretKey(), SettingController.modifySetting);

//update setting switch
route.patch("/toggleAppSetting", checkAccessWithSecretKey(), SettingController.toggleAppSetting);

//get setting
route.get("/getSettingsData", checkAccessWithSecretKey(), SettingController.getSettingsData);

module.exports = route;
