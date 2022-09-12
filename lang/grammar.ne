@builtin "whitespace.ne"

script -> statement {% data => data[0] %}
    | statement "\n" script {% data => [data[0]].concat(data[2]) %}

statement -> _ directive _ {% data => data[1] %}
            | "#" _ comment _ {% data => { return {operator: "comment"} } %}

comment -> [a-zA-Z 0-9_@./#&+-]:+ {% d => d[0].join("") %}

setStatement -> "$.setChain(" _ number _ ")"  {% data => { return {operator: "set_chain", chainId: data[2]} } %}

letStatement -> "Token" _ string _ "=" _ token {% data => { return {operator: "assign", name: data[2], value: data[6]} } %}

directive -> _ "(" _ directive _ ")" _ {% data => data[3] %}
    | _ returnStatement _ {% data => data[1] %}
    | _ letStatement _ {% data => data[1] %}
    | _ setStatement _ {% data => data[1] %}
    | _ ifStatement _  {% data => data[1] %}

returnStatement -> "return" _ condition {% data => { return {operator: "return", value: data[2]} } %}
            | "return" _ value {% data => { return {operator: "return", value: data[2]} } %}

ifStatement -> "if" _ condition _ "then" _ directive _ {% (data) => { return {operator: "if", if: data[2], then: data[6]} } %}
            | "if" _ condition _ "then" _ directive _ "else" _ directive {% (data) => { return {operator: "if", if: data[2], then: data[6], else: data[10]} } %}

condition ->
   "(" _ condition _ ")" {% (data) => { return data[2] }  %}
  | value _ ">" _ value {% (data) => { return {operator: ">", left: data[0], right: data[4]} } %}
  | value _ "<" _  value {% (data) => { return {operator: ">", left: data[4], right: data[0]} }  %}
  | value _ ">=" _  value {% (data) => { return {operator: ">=", left: data[0], right: data[4]} } %}
  | value _ "<=" _  value {% (data) => { return {operator: ">=", left: data[4], right: data[0]} } %}
  | value _ "==" _  value {% (data) => { return {operator: "==", left: data[0], right: data[4]} } %}
  | contract _ "==" _  contract {% (data) => { return {operator: "==", left: data[0], right: data[4]} } %}
  | contract _ "!=" _  contract {% (data) => { return {operator: "!=", left: data[0], right: data[4]} } %}
  | value _ "!=" _  value {% (data) => { return {operator: "!=", left: data[0], right: data[4]} } %}
  | condition _ "&&" _  condition {% (data) => { return {operator: "&&", left: data[0], right: data[4]} } %}
  | condition _ "||" _  condition {% (data) => { return {operator: "||", left: data[0], right: data[4]} } %}
  | "!" _ condition {% (data) => { return {operator: "!", child: data[2]} } %}
  | "true" {% (data) => { return true } %}
  | "false" {% (data) => { return false } %}

token -> _ "ERC20(" contract ")" _ {% (data) => { return {operator: "ERC20", address: data[2]} } %}
  | _ "ERC721(" contract ")" _  {% (data) => { return {operator: "ERC721", address: data[2]} } %}
  | _ "ETH" _  {% () => { return "ETH" } %}

value -> "(" _ value _ ")" {% (data) => { return data[2] }  %}
    | number {% d => d[0] %}
    | "$.balanceOf(" token ")" {% d => d[1] %}
    | "$.balanceOf(" string ")" {% d => d[1] %}

contract -> "0x" [a-fA-F0-9]:+ {% d => "0x" + d[1].join("") %}
    | "$.address" {% data => data[0] %}
 
string -> [a-zA-Z]:+ {% d => d[0].join("") %}

number -> [0-9]:+ {% d => parseInt(d[0].join("")) %}
        | decimal {% data => data[0] %}
        | "(" _ number _ ")" {% data => data[2] %}

decimal -> [0-9]:+ ("." [0-9]:+):? {% d => parseFloat(d[0].join("") + (d[1] ? "."+d[1][1].join("") : "")) %}