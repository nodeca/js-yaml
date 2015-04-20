'use strict';

var assert = require('assert');
var yaml   = require('../..');

test('simple scalar', function () {
  assert.equal(yaml.safeDump('simple'), 'simple\n');
});

test('quoted scalars', function () {
  // boolean-ish things get quoted.
  assert.equal(yaml.safeDump('Yes'), '\'Yes\'\n');
  assert.equal(yaml.safeDump('true'), '\'true\'\n');

  // If the only funky char is a ", then single-quote it.
  assert.equal(yaml.safeDump('quoted"scalar'), '\'quoted"scalar\'\n');
  assert.equal(yaml.safeDump('quoted\'scalar'), '"quoted\'scalar"\n');
  assert.equal(yaml.safeDump('a\nb\u0001c'), '"a\\nb\\x01c"\n');
  assert.equal(yaml.safeDump('a\nb \n c'), '"a\\nb \\n c"\n');
});

test('literal', function () {
  assert.equal(yaml.safeDump('a\nb\nc\nd'), '|-\na\nb\nc\nd\n');
  assert.equal(yaml.safeDump('a\nb\nc\nd\n'), '|\na\nb\nc\nd\n');
  assert.equal(yaml.safeDump('a\nb\nc\nd\n\n'), '|+\na\nb\nc\nd\n\n\n');
});

test('fold', function () {
  var essay = '';
  for (var i = 1001; i < 1200; i++) {
    if (i % 50 === 0) {
      essay += '\n';
    } else if (essay) {
      if (i % 11 === 0 || i === 1066) {
        // throw some double-spaces in there for good measure.
        // this forces 1065 and 1066 to the same line.
        essay += '  ';
      } else {
        essay += ' ';
      }
    }
    essay += i;
  }

  var folded =
    // Note the oddball "one word wrapped to next line" edge case!
    '1001 1002 1003 1004 1005 1006 1007 1008 1009 1010 1011  1012 1013 1014 1015 1016\n' +
    '1017 1018 1019 1020 1021 1022  1023 1024 1025 1026 1027 1028 1029 1030 1031 1032\n' +
    '1033  1034 1035 1036 1037 1038 1039 1040 1041 1042 1043 1044  1045 1046 1047 1048\n' +
    '1049\n' +
    '\n' +
    '1050 1051 1052 1053 1054 1055  1056 1057 1058 1059 1060 1061 1062 1063 1064\n' +
    '1065  1066  1067 1068 1069 1070 1071 1072 1073 1074 1075 1076 1077  1078 1079\n' +
    '1080 1081 1082 1083 1084 1085 1086 1087 1088  1089 1090 1091 1092 1093 1094 1095\n' +
    '1096 1097 1098 1099\n' +
    '\n' +
    '1100 1101 1102 1103 1104 1105 1106 1107 1108 1109 1110  1111 1112 1113 1114 1115\n' +
    '1116 1117 1118 1119 1120 1121  1122 1123 1124 1125 1126 1127 1128 1129 1130 1131\n' +
    '1132  1133 1134 1135 1136 1137 1138 1139 1140 1141 1142 1143  1144 1145 1146 1147\n' +
    '1148 1149\n' +
    '\n' +
    '1150 1151 1152 1153 1154  1155 1156 1157 1158 1159 1160 1161 1162 1163 1164\n' +
    '1165  1166 1167 1168 1169 1170 1171 1172 1173 1174 1175 1176  1177 1178 1179 1180\n' +
    '1181 1182 1183 1184 1185 1186 1187  1188 1189 1190 1191 1192 1193 1194 1195 1196\n' +
    '1197 1198  1199\n';

  assert.equal(yaml.safeDump(essay), '>-\n' + folded);
  assert.equal(yaml.safeDump(essay + '\n'), '>\n' + folded);
  assert.equal(yaml.safeDump(essay + '\n\n'), '>+\n' + folded + '\n\n');
  assert.equal(yaml.safeDump(essay + '\n\n\n'), '>+\n' + folded + '\n\n\n');
});
