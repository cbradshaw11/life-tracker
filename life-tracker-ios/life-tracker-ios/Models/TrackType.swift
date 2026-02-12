//
//  TrackType.swift
//  life-tracker-ios
//

import Foundation

struct TrackType: Codable, Identifiable, Equatable {
    var id: String
    var label: String
    var color: String
    var valueType: String
    var valueUnit: String?
    var durationUnit: String?
    var metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id, label, color, metadata
        case valueType = "value_type"
        case valueUnit = "value_unit"
        case durationUnit = "duration_unit"
    }

    init(id: String, label: String, color: String, valueType: String = "count",
         valueUnit: String? = nil, durationUnit: String? = nil, metadata: [String: String]? = nil) {
        self.id = id
        self.label = label
        self.color = color
        self.valueType = valueType
        self.valueUnit = valueUnit
        self.durationUnit = durationUnit
        self.metadata = metadata
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        label = try c.decode(String.self, forKey: .label)
        color = try c.decode(String.self, forKey: .color)
        valueType = try c.decodeIfPresent(String.self, forKey: .valueType) ?? "count"
        valueUnit = try c.decodeIfPresent(String.self, forKey: .valueUnit)
        durationUnit = try c.decodeIfPresent(String.self, forKey: .durationUnit)
        if let meta = try c.decodeIfPresent([String: String].self, forKey: .metadata), !meta.isEmpty {
            metadata = meta
        } else {
            metadata = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(label, forKey: .label)
        try c.encode(color, forKey: .color)
        try c.encode(valueType, forKey: .valueType)
        try c.encodeIfPresent(valueUnit, forKey: .valueUnit)
        try c.encodeIfPresent(durationUnit, forKey: .durationUnit)
        try c.encodeIfPresent(metadata, forKey: .metadata)
    }
}
