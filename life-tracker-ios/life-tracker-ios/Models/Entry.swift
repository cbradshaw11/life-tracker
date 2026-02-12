//
//  Entry.swift
//  life-tracker-ios
//

import Foundation

struct Entry: Codable, Identifiable, Equatable {
    var id: String
    var date: String
    var trackTypeId: String
    var value: Double?
    var note: String?
    var metadata: [String: String]?

    enum CodingKeys: String, CodingKey {
        case id, date, value, note, metadata
        case trackTypeId = "track_type_id"
    }

    init(id: String, date: String, trackTypeId: String, value: Double? = nil,
         note: String? = nil, metadata: [String: String]? = nil) {
        self.id = id
        self.date = date
        self.trackTypeId = trackTypeId
        self.value = value
        self.note = note
        self.metadata = metadata
    }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        date = try c.decode(String.self, forKey: .date)
        trackTypeId = try c.decode(String.self, forKey: .trackTypeId)
        value = try c.decodeIfPresent(Double.self, forKey: .value)
        note = try c.decodeIfPresent(String.self, forKey: .note)
        if let meta = try c.decodeIfPresent([String: String].self, forKey: .metadata), !meta.isEmpty {
            metadata = meta
        } else {
            metadata = nil
        }
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(id, forKey: .id)
        try c.encode(date, forKey: .date)
        try c.encode(trackTypeId, forKey: .trackTypeId)
        try c.encodeIfPresent(value, forKey: .value)
        try c.encodeIfPresent(note, forKey: .note)
        try c.encodeIfPresent(metadata, forKey: .metadata)
    }
}
