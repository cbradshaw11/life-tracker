//
//  FormatValue.swift
//  life-tracker-ios
//

import Foundation

enum FormatValue {
    /// Format entry value for display (e.g. "5", "30 min", "1.5")
    static func formatEntryValue(_ entry: Entry, trackType: TrackType?) -> String? {
        guard let v = entry.value else { return nil }
        let unit = trackType?.valueUnit ?? trackType?.metadata?["unit"] ?? ""
        if unit.isEmpty { return String(format: "%g", v) }
        return "\(String(format: "%g", v)) \(unit)"
    }
}
