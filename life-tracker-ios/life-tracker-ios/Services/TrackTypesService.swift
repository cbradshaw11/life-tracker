//
//  TrackTypesService.swift
//  life-tracker-ios
//

import Foundation
import Supabase

struct TrackTypesService {
    private let client: SupabaseClient?

    init(client: SupabaseClient? = SupabaseClientFactory.client) {
        self.client = client
    }

    private func requireClient() throws -> SupabaseClient {
        guard let client else {
            throw NSError(domain: "LifeTracker", code: -1, userInfo: [NSLocalizedDescriptionKey: "Supabase is not configured. Set your project URL and anon key in SupabaseConfig."])
        }
        return client
    }

    func getTrackTypes(userId: String) async throws -> [TrackType] {
        let client = try requireClient()
        let response: [TrackTypeRow] = try await client
            .from("track_types")
            .select("id, label, color, value_type, value_unit, duration_unit, metadata")
            .eq("user_id", value: userId)
            .execute()
            .value
        let types = response.map { mapRow($0) }
        // One-time migration: remove legacy defaults if user has exactly those 3 (match web)
        let legacyLabels = ["Drinking", "Smoking", "Workout"].sorted()
        let labels = types.map(\.label).sorted()
        if types.count == 3, labels == legacyLabels {
            for t in types {
                try await client
                    .from("track_types")
                    .delete()
                    .eq("id", value: t.id)
                    .eq("user_id", value: userId)
                    .execute()
            }
            return []
        }
        return types
    }

    func addTrackType(userId: String, trackType: TrackType) async throws -> TrackType {
        let client = try requireClient()
        let payload = TrackTypeInsert(
            user_id: userId,
            label: trackType.label,
            color: trackType.color,
            value_type: trackType.valueType,
            value_unit: trackType.valueUnit,
            duration_unit: trackType.durationUnit,
            metadata: trackType.metadata
        )
        let response: TrackTypeRow = try await client
            .from("track_types")
            .insert(payload)
            .select("id, label, color, value_type, value_unit, duration_unit, metadata")
            .single()
            .execute()
            .value
        return mapRow(response)
    }

    func updateTrackType(userId: String, id: String, updates: TrackTypeUpdates) async throws {
        let client = try requireClient()
        let payload = TrackTypeUpdatePayload(
            label: updates.label,
            color: updates.color,
            value_type: updates.valueType,
            value_unit: updates.valueUnit,
            duration_unit: updates.durationUnit,
            metadata: updates.metadata
        )
        if payload.isEmpty { return }
        try await client
            .from("track_types")
            .update(payload)
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .execute()
    }

    func deleteTrackType(userId: String, id: String) async throws {
        let client = try requireClient()
        try await client
            .from("track_types")
            .delete()
            .eq("id", value: id)
            .eq("user_id", value: userId)
            .execute()
    }
}

// MARK: - DTOs and mapping

private struct TrackTypeRow: Codable {
    let id: String
    let label: String
    let color: String
    let value_type: String
    let value_unit: String?
    let duration_unit: String?
    let metadata: [String: String]?
}

private func mapRow(_ row: TrackTypeRow) -> TrackType {
    TrackType(
        id: row.id,
        label: row.label,
        color: row.color,
        valueType: row.value_type,
        valueUnit: row.value_unit,
        durationUnit: row.duration_unit,
        metadata: row.metadata.flatMap { $0.isEmpty ? nil : $0 }
    )
}

private struct TrackTypeInsert: Encodable {
    let user_id: String
    let label: String
    let color: String
    let value_type: String
    let value_unit: String?
    let duration_unit: String?
    let metadata: [String: String]?
}

struct TrackTypeUpdates {
    var label: String?
    var color: String?
    var valueType: String?
    var valueUnit: String?
    var durationUnit: String?
    var metadata: [String: String]?
}

private struct TrackTypeUpdatePayload: Encodable {
    let label: String?
    let color: String?
    let value_type: String?
    let value_unit: String?
    let duration_unit: String?
    let metadata: [String: String]?

    var isEmpty: Bool {
        label == nil && color == nil && value_type == nil && value_unit == nil && duration_unit == nil && metadata == nil
    }

    enum CodingKeys: String, CodingKey {
        case label, color, metadata
        case value_type, value_unit, duration_unit
    }

    init(label: String?, color: String?, value_type: String?, value_unit: String?, duration_unit: String?, metadata: [String: String]?) {
        self.label = label
        self.color = color
        self.value_type = value_type
        self.value_unit = value_unit
        self.duration_unit = duration_unit
        self.metadata = metadata
    }

    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encodeIfPresent(label, forKey: .label)
        try c.encodeIfPresent(color, forKey: .color)
        try c.encodeIfPresent(value_type, forKey: .value_type)
        try c.encodeIfPresent(value_unit, forKey: .value_unit)
        try c.encodeIfPresent(duration_unit, forKey: .duration_unit)
        try c.encodeIfPresent(metadata, forKey: .metadata)
    }
}
