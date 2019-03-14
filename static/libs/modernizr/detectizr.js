/*! Detectizr v2.2.0 | (c) 2012 Baris Aydinoglu | Licensed  */
window.Detectizr = (function(a, b, c, d) {
  let e = {},
    f = a.Modernizr,
    g = ["tv", "tablet", "mobile", "desktop"],
    h = {
      addAllFeaturesAsClass: !1,
      detectDevice: !0,
      detectDeviceModel: !0,
      detectScreen: !0,
      detectOS: !0,
      detectBrowser: !0,
      detectPlugins: !0
    },
    i = [
      {
        name: "adobereader",
        substrs: ["Adobe", "Acrobat"],
        progIds: ["AcroPDF.PDF", "PDF.PDFCtrl.5"]
      },
      {
        name: "flash",
        substrs: ["Shockwave Flash"],
        progIds: ["ShockwaveFlash.ShockwaveFlash.1"]
      },
      {
        name: "wmplayer",
        substrs: ["Windows Media"],
        progIds: ["wmplayer.ocx"]
      },
      {
        name: "silverlight",
        substrs: ["Silverlight"],
        progIds: ["AgControl.AgControl"]
      },
      {
        name: "quicktime",
        substrs: ["QuickTime"],
        progIds: ["QuickTime.QuickTime"]
      }
    ],
    j = /[\t\r\n]/g,
    k = c.documentElement,
    l,
    m;
  function n(a, b) {
    let c, d, e;
    if (arguments.length > 2)
      for (c = 1, d = arguments.length; d > c; c += 1) n(a, arguments[c]);
    else for (e in b) b.hasOwnProperty(e) && (a[e] = b[e]);
    return a;
  }
  function o(a) {
    return e.browser.userAgent.indexOf(a) > -1;
  }
  function p(a) {
    return a.test(e.browser.userAgent);
  }
  function q(a) {
    return a.exec(e.browser.userAgent);
  }
  function r(a) {
    return a.replace(/^\s+|\s+$/g, "");
  }
  function s(a) {
    return a === null || a === d
      ? ""
      : String(a).replace(/((\s|\-|\.)+[a-z0-9])/g, function(a) {
          return a.toUpperCase().replace(/(\s|\-|\.)/g, "");
        });
  }
  function t(a, b) {
    let c = b || "",
      d =
        a.nodeType === 1 &&
        (a.className ? (" " + a.className + " ").replace(j, " ") : "");
    if (d) {
      while (d.indexOf(" " + c + " ") >= 0) d = d.replace(" " + c + " ", " ");
      a.className = b ? r(d) : "";
    }
  }
  function u(a, b, c) {
    a &&
      ((a = s(a)),
      b && ((b = s(b)), v(a + b, !0), c && v(a + b + "_" + c, !0)));
  }
  function v(a, b) {
    a &&
      f &&
      (h.addAllFeaturesAsClass
        ? f.addTest(a, b)
        : ((b = typeof b === "function" ? b() : b),
          b ? f.addTest(a, !0) : (delete f[a], t(k, a))));
  }
  function w(a, b) {
    a.version = b;
    let c = b.split(".");
    c.length > 0
      ? ((c = c.reverse()),
        (a.major = c.pop()),
        c.length > 0
          ? ((a.minor = c.pop()),
            c.length > 0
              ? ((c = c.reverse()), (a.patch = c.join(".")))
              : (a.patch = "0"))
          : (a.minor = "0"))
      : (a.major = "0");
  }
  function x() {
    a.clearTimeout(l),
      (l = a.setTimeout(function() {
        (m = e.device.orientation),
          a.innerHeight > a.innerWidth
            ? (e.device.orientation = "portrait")
            : (e.device.orientation = "landscape"),
          v(e.device.orientation, !0),
          m !== e.device.orientation && v(m, !1);
      }, 10));
  }
  function y(a) {
    let c = b.plugins,
      d,
      e,
      f,
      g,
      h;
    for (g = c.length - 1; g >= 0; g--) {
      for (
        d = c[g], e = d.name + d.description, f = 0, h = a.length;
        h >= 0;
        h--
      )
        e.indexOf(a[h]) !== -1 && (f += 1);
      if (f === a.length) return !0;
    }
    return !1;
  }
  function z(a) {
    let b;
    for (b = a.length - 1; b >= 0; b--)
      try {
        new ActiveXObject(a[b]);
      } catch (c) {}
    return !1;
  }
  function A(d) {
    let j, k, l, m, r, t, A;
    if (((h = n({}, h, d || {})), h.detectDevice)) {
      for (
        e.device = { type: "", model: "", orientation: "" },
          l = e.device,
          p(
            /googletv|smarttv|smart-tv|internet.tv|netcast|nettv|appletv|boxee|kylo|roku|dlnadoc|roku|pov_tv|hbbtv|ce\-html/
          )
            ? ((l.type = g[0]), (l.model = "smartTv"))
            : p(/xbox|playstation.3|wii/)
            ? ((l.type = g[0]), (l.model = "gameConsole"))
            : p(/ip(a|ro)d/)
            ? ((l.type = g[1]), (l.model = "ipad"))
            : (p(/tablet/) && !p(/rx-34/)) || p(/folio/)
            ? ((l.type = g[1]), (l.model = String(q(/playbook/) || "")))
            : p(/linux/) &&
              p(/android/) &&
              !p(/fennec|mobi|htc.magic|htcX06ht|nexus.one|sc-02b|fone.945/)
            ? ((l.type = g[1]), (l.model = "android"))
            : p(/kindle/) || (p(/mac.os/) && p(/silk/))
            ? ((l.type = g[1]), (l.model = "kindle"))
            : p(
                /gt-p10|sc-01c|shw-m180s|sgh-t849|sch-i800|shw-m180l|sph-p100|sgh-i987|zt180|htc(.flyer|\_flyer)|sprint.atp51|viewpad7|pandigital(sprnova|nova)|ideos.s7|dell.streak.7|advent.vega|a101it|a70bht|mid7015|next2|nook/
              ) ||
              (p(/mb511/) && p(/rutem/))
            ? ((l.type = g[1]), (l.model = "android"))
            : p(/bb10/)
            ? ((l.type = g[1]), (l.model = "blackberry"))
            : ((l.model = q(
                /iphone|ipod|android|blackberry|opera mini|opera mobi|skyfire|maemo|windows phone|palm|iemobile|symbian|symbianos|fennec|j2me/
              )),
              l.model !== null
                ? ((l.type = g[2]), (l.model = String(l.model)))
                : ((l.model = ""),
                  p(
                    /bolt|fennec|iris|maemo|minimo|mobi|mowser|netfront|novarra|prism|rx-34|skyfire|tear|xv6875|xv6975|google.wireless.transcoder/
                  )
                    ? (l.type = g[2])
                    : p(/opera/) &&
                      p(/windows.nt.5/) &&
                      p(
                        /htc|xda|mini|vario|samsung\-gt\-i8000|samsung\-sgh\-i9/
                      )
                    ? (l.type = g[2])
                    : (p(/windows.(nt|xp|me|9)/) && !p(/phone/)) ||
                      p(/win(9|.9|nt)/) ||
                      p(/\(windows 8\)/)
                    ? (l.type = g[3])
                    : p(/macintosh|powerpc/) && !p(/silk/)
                    ? ((l.type = g[3]), (l.model = "mac"))
                    : p(/linux/) && p(/x11/)
                    ? (l.type = g[3])
                    : p(/solaris|sunos|bsd/)
                    ? (l.type = g[3])
                    : p(/cros/)
                    ? (l.type = g[3])
                    : p(
                        /bot|crawler|spider|yahoo|ia_archiver|covario-ids|findlinks|dataparksearch|larbin|mediapartners-google|ng-search|snappy|teoma|jeeves|tineye/
                      ) && !p(/mobile/)
                    ? ((l.type = g[3]), (l.model = "crawler"))
                    : (l.type = g[2]))),
          j = 0,
          k = g.length;
        k > j;
        j += 1
      )
        v(g[j], l.type === g[j]);
      h.detectDeviceModel && v(s(l.model), !0);
    }
    if (
      (h.detectScreen &&
        ((l.screen = {}),
        f &&
          f.mq &&
          (f.mq("only screen and (max-width: 240px)")
            ? ((l.screen.size = "veryVerySmall"), v("veryVerySmallScreen", !0))
            : f.mq("only screen and (max-width: 320px)")
            ? ((l.screen.size = "verySmall"), v("verySmallScreen", !0))
            : f.mq("only screen and (max-width: 480px)") &&
              ((l.screen.size = "small"), v("smallScreen", !0)),
          (l.type === g[1] || l.type === g[2]) &&
            f.mq(
              "only screen and (-moz-min-device-pixel-ratio: 1.3), only screen and (-o-min-device-pixel-ratio: 2.6/2), only screen and (-webkit-min-device-pixel-ratio: 1.3), only screen  and (min-device-pixel-ratio: 1.3), only screen and (min-resolution: 1.3dppx)"
            ) &&
            ((l.screen.resolution = "high"), v("highresolution", !0))),
        l.type === g[1] || l.type === g[2]
          ? ((a.onresize = function(a) {
              x(a);
            }),
            x())
          : ((l.orientation = "landscape"), v(l.orientation, !0))),
      h.detectOS &&
        ((e.os = {}),
        (m = e.os),
        l.model !== "" &&
          (l.model === "ipad" || l.model === "iphone" || l.model === "ipod"
            ? ((m.name = "ios"),
              w(m, (p(/os\s([\d_]+)/) ? RegExp.$1 : "").replace(/_/g, ".")))
            : l.model === "android"
            ? ((m.name = "android"),
              w(m, p(/android\s([\d\.]+)/) ? RegExp.$1 : ""))
            : l.model === "blackberry"
            ? ((m.name = "blackberry"),
              w(m, p(/version\/([^\s]+)/) ? RegExp.$1 : ""))
            : l.model === "playbook" &&
              ((m.name = "blackberry"),
              w(m, p(/os ([^\s]+)/) ? RegExp.$1.replace(";", "") : ""))),
        m.name ||
          (o("win") || o("16bit")
            ? ((m.name = "windows"),
              o("windows nt 10")
                ? w(m, "10")
                : o("windows nt 6.3")
                ? w(m, "8.1")
                : o("windows nt 6.2") || p(/\(windows 8\)/)
                ? w(m, "8")
                : o("windows nt 6.1")
                ? w(m, "7")
                : o("windows nt 6.0")
                ? w(m, "vista")
                : o("windows nt 5.2") || o("windows nt 5.1") || o("windows xp")
                ? w(m, "xp")
                : o("windows nt 5.0") || o("windows 2000")
                ? w(m, "2k")
                : o("winnt") || o("windows nt")
                ? w(m, "nt")
                : o("win98") || o("windows 98")
                ? w(m, "98")
                : (o("win95") || o("windows 95")) && w(m, "95"))
            : o("mac") || o("darwin")
            ? ((m.name = "mac os"),
              o("68k") || o("68000")
                ? w(m, "68k")
                : o("ppc") || o("powerpc")
                ? w(m, "ppc")
                : o("os x") &&
                  w(
                    m,
                    (p(/os\sx\s([\d_]+)/) ? RegExp.$1 : "os x").replace(
                      /_/g,
                      "."
                    )
                  ))
            : o("webtv")
            ? (m.name = "webtv")
            : o("x11") || o("inux")
            ? (m.name = "linux")
            : o("sunos")
            ? (m.name = "sun")
            : o("irix")
            ? (m.name = "irix")
            : o("freebsd")
            ? (m.name = "freebsd")
            : o("bsd") && (m.name = "bsd")),
        m.name &&
          (v(m.name, !0),
          m.major &&
            (u(m.name, m.major), m.minor && u(m.name, m.major, m.minor))),
        p(/\sx64|\sx86|\swin64|\swow64|\samd64/)
          ? (m.addressRegisterSize = "64bit")
          : (m.addressRegisterSize = "32bit"),
        v(m.addressRegisterSize, !0)),
      h.detectBrowser &&
        ((r = e.browser),
        p(/opera|webtv/) || (!p(/msie\s([\d\w\.]+)/) && !o("trident"))
          ? o("firefox")
            ? ((r.engine = "gecko"),
              (r.name = "firefox"),
              w(r, p(/firefox\/([\d\w\.]+)/) ? RegExp.$1 : ""))
            : o("gecko/")
            ? (r.engine = "gecko")
            : o("opera")
            ? ((r.name = "opera"),
              (r.engine = "presto"),
              w(
                r,
                p(/version\/([\d\.]+)/)
                  ? RegExp.$1
                  : p(/opera(\s|\/)([\d\.]+)/)
                  ? RegExp.$2
                  : ""
              ))
            : o("konqueror")
            ? (r.name = "konqueror")
            : o("edge")
            ? ((r.engine = "webkit"),
              (r.name = "edge"),
              w(r, p(/edge\/([\d\.]+)/) ? RegExp.$1 : ""))
            : o("chrome")
            ? ((r.engine = "webkit"),
              (r.name = "chrome"),
              w(r, p(/chrome\/([\d\.]+)/) ? RegExp.$1 : ""))
            : o("iron")
            ? ((r.engine = "webkit"), (r.name = "iron"))
            : o("crios")
            ? ((r.name = "chrome"),
              (r.engine = "webkit"),
              w(r, p(/crios\/([\d\.]+)/) ? RegExp.$1 : ""))
            : o("applewebkit/")
            ? ((r.name = "safari"),
              (r.engine = "webkit"),
              w(r, p(/version\/([\d\.]+)/) ? RegExp.$1 : ""))
            : o("mozilla/") && (r.engine = "gecko")
          : ((r.engine = "trident"),
            (r.name = "ie"),
            !a.addEventListener && c.documentMode && c.documentMode === 7
              ? w(r, "8.compat")
              : p(/trident.*rv[ :](\d+)\./)
              ? w(r, RegExp.$1)
              : w(r, p(/trident\/4\.0/) ? "8" : RegExp.$1)),
        r.name &&
          (v(r.name, !0),
          r.major &&
            (u(r.name, r.major), r.minor && u(r.name, r.major, r.minor))),
        v(r.engine, !0),
        (r.language = b.userLanguage || b.language),
        v(r.language, !0)),
      h.detectPlugins)
    ) {
      for (r.plugins = [], j = i.length - 1; j >= 0; j--)
        (t = i[j]),
          (A = !1),
          a.ActiveXObject
            ? (A = z(t.progIds))
            : b.plugins && (A = y(t.substrs)),
          A && (r.plugins.push(t.name), v(t.name, !0));
      b.javaEnabled() && (r.plugins.push("java"), v("java", !0));
    }
  }
  return (
    (e.detect = function(a) {
      return A(a);
    }),
    (e.init = function() {
      e !== d &&
        ((e.browser = {
          userAgent: (b.userAgent || b.vendor || a.opera).toLowerCase()
        }),
        e.detect());
    }),
    e.init(),
    e
  );
})(this, this.navigator, this.document);
//# sourceMappingURL=detectizr.min.map
