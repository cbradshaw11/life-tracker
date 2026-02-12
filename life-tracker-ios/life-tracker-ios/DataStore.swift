//
//  DataStore.swift
//  life-tracker-ios
//

import Combine
import Foundation

@MainActor
final class DataStore: ObservableObject {
    @Published var entries: [Entry] = []
    @Published var trackTypes: [TrackType] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    var userId: String? {
        didSet {
            if userId == nil {
                entries = []
                trackTypes = []
            } else {
                Task { await load() }
            }
        }
    }

    private let entriesService = EntriesService()
    private let trackTypesService = TrackTypesService()

    func load() async {
        guard let uid = userId else { return }
        isLoading = true
        errorMessage = nil
        do {
            async let entriesTask = entriesService.getEntries(userId: uid)
            async let typesTask = trackTypesService.getTrackTypes(userId: uid)
            let (e, t) = try await (entriesTask, typesTask)
            entries = e
            trackTypes = t
        } catch {
            errorMessage = error.localizedDescription
        }
        isLoading = false
    }

    func addEntry(_ newEntry: NewEntry) async throws -> Entry {
        guard let uid = userId else { throw NSError(domain: "DataStore", code: -1, userInfo: [NSLocalizedDescriptionKey: "Not signed in"]) }
        let entry = try await entriesService.addEntry(userId: uid, entry: newEntry)
        entries.append(entry)
        entries.sort { $0.date < $1.date }
        return entry
    }

    func updateEntry(id: String, updates: EntryUpdates) async throws {
        guard let uid = userId else { return }
        if let updated = try await entriesService.updateEntry(userId: uid, id: id, updates: updates) {
            if let i = entries.firstIndex(where: { $0.id == id }) {
                entries[i] = updated
            }
        }
    }

    func deleteEntry(id: String) async throws {
        guard let uid = userId else { return }
        _ = try await entriesService.deleteEntry(userId: uid, id: id)
        entries.removeAll { $0.id == id }
    }

    func addTrackType(_ trackType: TrackType) async throws -> TrackType {
        guard let uid = userId else { throw NSError(domain: "DataStore", code: -1, userInfo: [NSLocalizedDescriptionKey: "Not signed in"]) }
        let created = try await trackTypesService.addTrackType(userId: uid, trackType: trackType)
        trackTypes.append(created)
        return created
    }

    func updateTrackType(id: String, updates: TrackTypeUpdates) async throws {
        guard let uid = userId else { return }
        try await trackTypesService.updateTrackType(userId: uid, id: id, updates: updates)
        if let i = trackTypes.firstIndex(where: { $0.id == id }) {
            if let label = updates.label { trackTypes[i].label = label }
            if let color = updates.color { trackTypes[i].color = color }
            if let vt = updates.valueType { trackTypes[i].valueType = vt }
            if let vu = updates.valueUnit { trackTypes[i].valueUnit = vu }
            if let du = updates.durationUnit { trackTypes[i].durationUnit = du }
            if let meta = updates.metadata { trackTypes[i].metadata = meta }
        }
    }

    func deleteTrackType(id: String) async throws {
        guard let uid = userId else { return }
        try await trackTypesService.deleteTrackType(userId: uid, id: id)
        trackTypes.removeAll { $0.id == id }
    }

    private static var dateOnlyFormatter: DateFormatter = {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f
    }()

    func entriesPastMonth() -> [Entry] {
        let monthAgo = Calendar.current.date(byAdding: .month, value: -1, to: Date()) ?? Date()
        let monthStr = Self.dateOnlyFormatter.string(from: monthAgo)
        return entries.filter { $0.date >= monthStr }
    }

    func entriesPastYear() -> [Entry] {
        let yearAgo = Calendar.current.date(byAdding: .year, value: -1, to: Date()) ?? Date()
        let yearStr = Self.dateOnlyFormatter.string(from: yearAgo)
        return entries.filter { $0.date >= yearStr }
    }

    func entryCountPastMonth(trackTypeId: String) -> Int {
        entriesPastMonth().filter { $0.trackTypeId == trackTypeId }.count
    }

    func entryCountPastYear(trackTypeId: String) -> Int {
        entriesPastYear().filter { $0.trackTypeId == trackTypeId }.count
    }
}
