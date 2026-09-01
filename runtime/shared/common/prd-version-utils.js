/*
 * PRD 并行开发版本工具。
 *
 * 解析详细变更中的颜色与版本号，供 PRD 面板和产品导航共用。版本信息表本身
 * 不参与版本发现，避免由渲染后的表格颜色反向污染当前开发版本。
 */
(function (root) {
    function stripHtml(text) {
        return String(text || '').replace(/<[^>]+>/g, '');
    }

    function normalizeVersion(version) {
        return stripHtml(version).trim().replace(/^v/i, '').toLowerCase();
    }

    function extractVersion(text) {
        var match = stripHtml(text).match(/\b[vV]?\d+(?:\.\d+)+\b/);
        return match ? 'V' + match[0].replace(/^v/i, '') : '';
    }

    function compareVersions(left, right) {
        var leftParts = normalizeVersion(left).split('.').map(function (part) { return Number(part) || 0; });
        var rightParts = normalizeVersion(right).split('.').map(function (part) { return Number(part) || 0; });
        var length = Math.max(leftParts.length, rightParts.length);
        for (var index = 0; index < length; index += 1) {
            var difference = (leftParts[index] || 0) - (rightParts[index] || 0);
            if (difference) return difference;
        }
        return String(left).localeCompare(String(right), undefined, { numeric: true, sensitivity: 'base' });
    }

    function isTableDivider(line) {
        return /^\s*\|(?:\s*:?-{3,}:?\s*\|)+\s*$/.test(String(line || ''));
    }

    function isVersionHistoryTable(tableLines) {
        if (!tableLines || tableLines.length < 2 || !isTableDivider(tableLines[1])) return false;
        var firstHeader = (tableLines[0].split('|')[1] || '').replace(/<[^>]+>/g, '').trim();
        return firstHeader.indexOf('版本') !== -1;
    }

    function removeVersionHistoryTables(markdown) {
        var lines = String(markdown || '').split(/\r?\n/);
        var retained = [];
        for (var index = 0; index < lines.length; index += 1) {
            if (!/^\s*\|.*\|\s*$/.test(lines[index])) {
                retained.push(lines[index]);
                continue;
            }
            var tableLines = [];
            while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
                tableLines.push(lines[index]);
                index += 1;
            }
            index -= 1;
            if (!isVersionHistoryTable(tableLines)) retained = retained.concat(tableLines);
        }
        return retained.join('\n');
    }

    function collectColoredVersions(markdown) {
        var content = removeVersionHistoryTables(markdown);
        var pattern = /<span\b[^>]*style\s*=\s*["'][^"']*color\s*:\s*([^;"']+)[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi;
        var versions = [];
        var positions = {};
        var match;
        while ((match = pattern.exec(content))) {
            var version = extractVersion(match[2]);
            var color = String(match[1] || '').trim();
            var key = normalizeVersion(version);
            if (!key || !/^[#(),.%\w\s-]+$/.test(color)) continue;
            if (!Object.prototype.hasOwnProperty.call(positions, key)) {
                positions[key] = versions.length;
                versions.push({ version: version, color: color });
            }
        }
        return versions;
    }

    function getConfiguredColor(version, versionColors) {
        var key = normalizeVersion(version);
        var configured = versionColors || {};
        var matchedKey = Object.keys(configured).find(function (candidate) {
            return normalizeVersion(candidate) === key;
        });
        return matchedKey ? String(configured[matchedKey] || '').trim() : '';
    }

    function collectWorkspaceVersions(contents, options) {
        var optionsValue = options || {};
        var records = {};
        (contents || []).forEach(function (content) {
            collectColoredVersions(content).forEach(function (item) {
                var key = normalizeVersion(item.version);
                if (!records[key]) records[key] = { version: item.version, colors: [] };
                if (records[key].colors.indexOf(item.color) === -1) records[key].colors.push(item.color);
            });
        });
        return Object.keys(records).map(function (key) {
            var record = records[key];
            var configuredColor = getConfiguredColor(record.version, optionsValue.versionColors);
            return {
                version: record.version,
                color: configuredColor || record.colors[0] || 'inherit',
                colors: record.colors,
                hasColorConflict: record.colors.length > 1
            };
        }).sort(function (left, right) {
            return compareVersions(left.version, right.version);
        });
    }

    function unwrapCellColor(cell) {
        return String(cell || '').replace(/<span\b[^>]*style\s*=\s*["'][^"']*color\s*:[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '$1').trim();
    }

    function synchronizeVersionHistoryColors(markdown, options) {
        var detected = collectColoredVersions(markdown);
        var colors = {};
        detected.forEach(function (item) {
            colors[normalizeVersion(item.version)] = getConfiguredColor(item.version, options && options.versionColors) || item.color;
        });
        if (!Object.keys(colors).length) return markdown;

        var lines = String(markdown || '').split(/\r?\n/);
        var output = [];
        for (var index = 0; index < lines.length; index += 1) {
            if (!/^\s*\|.*\|\s*$/.test(lines[index])) {
                output.push(lines[index]);
                continue;
            }
            var tableLines = [];
            while (index < lines.length && /^\s*\|.*\|\s*$/.test(lines[index])) {
                tableLines.push(lines[index]);
                index += 1;
            }
            index -= 1;
            if (isVersionHistoryTable(tableLines)) {
                tableLines = tableLines.map(function (row, rowIndex) {
                    if (rowIndex < 2) return row;
                    var cells = row.split('|').slice(1, -1);
                    var version = extractVersion(cells[0]);
                    var color = colors[normalizeVersion(version)];
                    if (!color) return row;
                    return '| ' + cells.map(function (cell) {
                        return '<span style="color:' + color + '">' + unwrapCellColor(cell) + '</span>';
                    }).join(' | ') + ' |';
                });
            }
            output = output.concat(tableLines);
        }
        return output.join('\n');
    }

    root.OpenPrototypePrdVersions = {
        compare: compareVersions,
        contains: function (text, version) {
            var normalized = normalizeVersion(version);
            if (!normalized) return false;
            var pattern = '(^|[^0-9.])v?' + normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?=$|[^0-9.])';
            return new RegExp(pattern, 'i').test(String(text || ''));
        },
        collectColored: collectColoredVersions,
        collectWorkspace: collectWorkspaceVersions,
        synchronizeHistoryColors: synchronizeVersionHistoryColors,
        extractVersion: extractVersion,
        normalize: normalizeVersion
    };
})(window);
