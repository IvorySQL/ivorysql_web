/*!
 * Snowball JavaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(factory)
    } else if (typeof exports === 'object') {
        /**
         * Node. Does not work with strict CommonJS, but
         * only CommonJS-like environments that support module.exports,
         * like Node.
         */
        module.exports = factory()
    } else {
        // Browser globals (root is window)
        factory()(root.lunr);
    }
}(this, function () {
    /**
     * Just return a value to define the module export.
     * This example returns an object, but the module
     * can return a function as the exported value.
     */
    return function(lunr) {
        /* provides utilities for the included stemmers */
        lunr.stemmerSupport = {
            Among: function(s, substring_i, result, method) {
                this.toCharArray = function(s) {
                    var sLength = s.length, charArr = new Array(sLength);
                    for (var i = 0; i < sLength; i++)
                        charArr[i] = s.charCodeAt(i);
                    return charArr;
                };

                if ((!s && s != "") || (!substring_i && (substring_i != 0)) || !result)
                    throw ("Bad Among initialisation: s:" + s + ", substring_i: "
                        + substring_i + ", result: " + result);
                this.s_size = s.length;
                this.s = this.toCharArray(s);
                this.substring_i = substring_i;
                this.result = result;
                this.method = method;
            },
            SnowballProgram: function() {
                var current;
                return {
                    bra : 0,
                    ket : 0,
                    limit : 0,
                    cursor : 0,
                    limit_backward : 0,
                    setCurrent : function(word) {
                        current = word;
                        this.cursor = 0;
                        this.limit = word.length;
                        this.limit_backward = 0;
                        this.bra = this.cursor;
                        this.ket = this.limit;
                    },
                    getCurrent : function() {
                        var result = current;
                        current = null;
                        return result;
                    },
                    in_grouping : function(s, min, max) {
                        if (this.cursor < this.limit) {
                            var ch = current.charCodeAt(this.cursor);
                            if (ch <= max && ch >= min) {
                                ch -= min;
                                if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
                                    this.cursor++;
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    in_grouping_b : function(s, min, max) {
                        if (this.cursor > this.limit_backward) {
                            var ch = current.charCodeAt(this.cursor - 1);
                            if (ch <= max && ch >= min) {
                                ch -= min;
                                if (s[ch >> 3] & (0X1 << (ch & 0X7))) {
                                    this.cursor--;
                                    return true;
                                }
                            }
                        }
                        return false;
                    },
                    out_grouping : function(s, min, max) {
                        if (this.cursor < this.limit) {
                            var ch = current.charCodeAt(this.cursor);
                            if (ch > max || ch < min) {
                                this.cursor++;
                                return true;
                            }
                            ch -= min;
                            if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
                                this.cursor++;
                                return true;
                            }
                        }
                        return false;
                    },
                    out_grouping_b : function(s, min, max) {
                        if (this.cursor > this.limit_backward) {
                            var ch = current.charCodeAt(this.cursor - 1);
                            if (ch > max || ch < min) {
                                this.cursor--;
                                return true;
                            }
                            ch -= min;
                            if (!(s[ch >> 3] & (0X1 << (ch & 0X7)))) {
                                this.cursor--;
                                return true;
                            }
                        }
                        return false;
                    },
                    eq_s : function(s_size, s) {
                        if (this.limit - this.cursor < s_size)
                            return false;
                        for (var i = 0; i < s_size; i++)
                            if (current.charCodeAt(this.cursor + i) != s.charCodeAt(i))
                                return false;
                        this.cursor += s_size;
                        return true;
                    },
                    eq_s_b : function(s_size, s) {
                        if (this.cursor - this.limit_backward < s_size)
                            return false;
                        for (var i = 0; i < s_size; i++)
                            if (current.charCodeAt(this.cursor - s_size + i) != s
                                .charCodeAt(i))
                                return false;
                        this.cursor -= s_size;
                        return true;
                    },
                    find_among : function(v, v_size) {
                        var i = 0, j = v_size, c = this.cursor, l = this.limit, common_i = 0, common_j = 0, first_key_inspected = false;
                        while (true) {
                            var k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
                                ? common_i
                                : common_j, w = v[k];
                            for (var i2 = common; i2 < w.s_size; i2++) {
                                if (c + common == l) {
                                    diff = -1;
                                    break;
                                }
                                diff = current.charCodeAt(c + common) - w.s[i2];
                                if (diff)
                                    break;
                                common++;
                            }
                            if (diff < 0) {
                                j = k;
                                common_j = common;
                            } else {
                                i = k;
                                common_i = common;
                            }
                            if (j - i <= 1) {
                                if (i > 0 || j == i || first_key_inspected)
                                    break;
                                first_key_inspected = true;
                            }
                        }
                        while (true) {
                            var w = v[i];
                            if (common_i >= w.s_size) {
                                this.cursor = c + w.s_size;
                                if (!w.method)
                                    return w.result;
                                var res = w.method();
                                this.cursor = c + w.s_size;
                                if (res)
                                    return w.result;
                            }
                            i = w.substring_i;
                            if (i < 0)
                                return 0;
                        }
                    },
                    find_among_b : function(v, v_size) {
                        var i = 0, j = v_size, c = this.cursor, lb = this.limit_backward, common_i = 0, common_j = 0, first_key_inspected = false;
                        while (true) {
                            var k = i + ((j - i) >> 1), diff = 0, common = common_i < common_j
                                ? common_i
                                : common_j, w = v[k];
                            for (var i2 = w.s_size - 1 - common; i2 >= 0; i2--) {
                                if (c - common == lb) {
                                    diff = -1;
                                    break;
                                }
                                diff = current.charCodeAt(c - 1 - common) - w.s[i2];
                                if (diff)
                                    break;
                                common++;
                            }
                            if (diff < 0) {
                                j = k;
                                common_j = common;
                            } else {
                                i = k;
                                common_i = common;
                            }
                            if (j - i <= 1) {
                                if (i > 0 || j == i || first_key_inspected)
                                    break;
                                first_key_inspected = true;
                            }
                        }
                        while (true) {
                            var w = v[i];
                            if (common_i >= w.s_size) {
                                this.cursor = c - w.s_size;
                                if (!w.method)
                                    return w.result;
                                var res = w.method();
                                this.cursor = c - w.s_size;
                                if (res)
                                    return w.result;
                            }
                            i = w.substring_i;
                            if (i < 0)
                                return 0;
                        }
                    },
                    replace_s : function(c_bra, c_ket, s) {
                        var adjustment = s.length - (c_ket - c_bra), left = current
                            .substring(0, c_bra), right = current.substring(c_ket);
                        current = left + s + right;
                        this.limit += adjustment;
                        if (this.cursor >= c_ket)
                            this.cursor += adjustment;
                        else if (this.cursor > c_bra)
                            this.cursor = c_bra;
                        return adjustment;
                    },
                    slice_check : function() {
                        if (this.bra < 0 || this.bra > this.ket || this.ket > this.limit
                            || this.limit > current.length)
                            throw ("faulty slice operation");
                    },
                    slice_from : function(s) {
                        this.slice_check();
                        this.replace_s(this.bra, this.ket, s);
                    },
                    slice_del : function() {
                        this.slice_from("");
                    },
                    insert : function(c_bra, c_ket, s) {
                        var adjustment = this.replace_s(c_bra, c_ket, s);
                        if (c_bra <= this.bra)
                            this.bra += adjustment;
                        if (c_bra <= this.ket)
                            this.ket += adjustment;
                    },
                    slice_to : function() {
                        this.slice_check();
                        return current.substring(this.bra, this.ket);
                    },
                    eq_v_b : function(s) {
                        return this.eq_s_b(s.length, s);
                    }
                };
            }
        };

        lunr.trimmerSupport = {
            generateTrimmer: function(wordCharacters) {
                var startRegex = new RegExp("^[^" + wordCharacters + "]+")
                var endRegex = new RegExp("[^" + wordCharacters + "]+$")

                return function(token) {
                    // for lunr version 2
                    if (typeof token.update === "function") {
                        return token.update(function (s) {
                            return s
                                .replace(startRegex, '')
                                .replace(endRegex, '');
                        })
                    } else { // for lunr version 1
                        return token
                            .replace(startRegex, '')
                            .replace(endRegex, '');
                    }
                };
            }
        }
    }
}));
/*!
 * Lunr languages, `Chinese` language
 * https://github.com/MihaiValentin/lunr-languages
 *
 * Copyright 2019, Felix Lian (repairearth)
 * http://www.mozilla.org/MPL/
 */
/*!
 * based on
 * Snowball zhvaScript Library v0.3
 * http://code.google.com/p/urim/
 * http://snowball.tartarus.org/
 *
 * Copyright 2010, Oleg Mazko
 * http://www.mozilla.org/MPL/
 */

/**
 * export the module via AMD, CommonJS or as a browser global
 * Export code from https://github.com/umdjs/umd/blob/master/returnExports.js
 */
;
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(factory)
  } else if (typeof exports === 'object') {
    /**
     * Node. Does not work with strict CommonJS, but
     * only CommonJS-like environments that support module.exports,
     * like Node.
     */
    module.exports = factory(require('nodejieba'))
  } else {
    // Browser globals (root is window)
    factory()(root.lunr);
  }
}(this, function(nodejieba) {
  /**
   * Just return a value to define the module export.
   * This example returns an object, but the module
   * can return a function as the exported value.
   */
  return function(lunr, nodejiebaDictJson) {
    /* throw error if lunr is not yet included */
    if ('undefined' === typeof lunr) {
      throw new Error('Lunr is not present. Please include / require Lunr before this script.');
    }

    /* throw error if lunr stemmer support is not yet included */
    if ('undefined' === typeof lunr.stemmerSupport) {
      throw new Error('Lunr stemmer support is not present. Please include / require Lunr stemmer support before this script.');
    }

    /*
    Chinese tokenization is trickier, since it does not
    take into account spaces.
    Since the tokenization function is represented different
    internally for each of the Lunr versions, this had to be done
    in order to try to try to pick the best way of doing this based
    on the Lunr version
     */
    var isLunr2 = lunr.version[0] == "2";

    /* register specific locale function */
    lunr.zh = function() {
      this.pipeline.reset();
      this.pipeline.add(
        lunr.zh.trimmer,
        lunr.zh.stopWordFilter,
        lunr.zh.stemmer
      );

      // change the tokenizer for Chinese one
      if (isLunr2) { // for lunr version 2.0.0
        this.tokenizer = lunr.zh.tokenizer;
      } else {
        if (lunr.tokenizer) { // for lunr version 0.6.0
          lunr.tokenizer = lunr.zh.tokenizer;
        }
        if (this.tokenizerFn) { // for lunr version 0.7.0 -> 1.0.0
          this.tokenizerFn = lunr.zh.tokenizer;
        }
      }
    };

    lunr.zh.tokenizer = function(obj) {
      if (!arguments.length || obj == null || obj == undefined) return []
      if (Array.isArray(obj)) return obj.map(function(t) {
        return isLunr2 ? new lunr.Token(t.toLowerCase()) : t.toLowerCase()
      })

      nodejiebaDictJson && nodejieba.load(nodejiebaDictJson)

      var str = obj.toString().trim().toLowerCase();
      var tokens = [];

      nodejieba.cut(str, true).forEach(function(seg) {
        tokens = tokens.concat(seg.split(' '))
      })

      tokens = tokens.filter(function(token) {
        return !!token;
      });

      var fromIndex = 0

      return tokens.map(function(token, index) {
        if (isLunr2) {
          var start = str.indexOf(token, fromIndex)

          var tokenMetadata = {}
          tokenMetadata["position"] = [start, token.length]
          tokenMetadata["index"] = index

          fromIndex = start

          return new lunr.Token(token, tokenMetadata);
        } else {
          return token
        }
      });
    }

    /* lunr trimmer function */
    lunr.zh.wordCharacters = "\\w\u4e00-\u9fa5";
    lunr.zh.trimmer = lunr.trimmerSupport.generateTrimmer(lunr.zh.wordCharacters);
    lunr.Pipeline.registerFunction(lunr.zh.trimmer, 'trimmer-zh');

    /* lunr stemmer function */
    lunr.zh.stemmer = (function() {

      /* TODO Chinese stemmer  */
      return function(word) {
        return word;
      }
    })();
    lunr.Pipeline.registerFunction(lunr.zh.stemmer, 'stemmer-zh');

    /* lunr stop word filter. see https://www.ranks.nl/stopwords/chinese-stopwords */
    lunr.zh.stopWordFilter = lunr.generateStopWordFilter(
      '的 一 不 在 人 有 是 为 以 于 上 他 而 后 之 来 及 了 因 下 可 到 由 这 与 也 此 但 并 个 其 已 无 小 我 们 起 最 再 今 去 好 只 又 或 很 亦 某 把 那 你 乃 它 吧 被 比 别 趁 当 从 到 得 打 凡 儿 尔 该 各 给 跟 和 何 还 即 几 既 看 据 距 靠 啦 了 另 么 每 们 嘛 拿 哪 那 您 凭 且 却 让 仍 啥 如 若 使 谁 虽 随 同 所 她 哇 嗡 往 哪 些 向 沿 哟 用 于 咱 则 怎 曾 至 致 着 诸 自'.split(' '));
    lunr.Pipeline.registerFunction(lunr.zh.stopWordFilter, 'stopWordFilter-zh');
  };
}))