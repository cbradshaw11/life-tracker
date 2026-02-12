//
//  DateHelpers.swift
//  life-tracker-ios
//

import Foundation

extension Calendar {
    static let gregorian: Calendar = {
        var c = Calendar(identifier: .gregorian)
        c.firstWeekday = 1 // Sunday
        return c
    }()
}

extension Date {
    /// yyyy-MM-dd
    static func dateString(from date: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f.string(from: date)
    }

    static func from(dateString: String) -> Date? {
        let f = DateFormatter()
        f.dateFormat = "yyyy-MM-dd"
        f.timeZone = TimeZone.current
        return f.date(from: dateString)
    }

    func startOfMonth(calendar: Calendar = .gregorian) -> Date {
        calendar.date(from: calendar.dateComponents([.year, .month], from: self)) ?? self
    }

    func endOfMonth(calendar: Calendar = .gregorian) -> Date {
        guard let next = calendar.date(byAdding: .month, value: 1, to: startOfMonth(calendar: calendar)),
              let end = calendar.date(byAdding: .day, value: -1, to: next) else { return self }
        return end
    }

    func startOfWeek(calendar: Calendar = .gregorian) -> Date {
        let comps = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: self)
        return calendar.date(from: comps) ?? self
    }

    func endOfWeek(calendar: Calendar = .gregorian) -> Date {
        guard let start = calendar.date(from: calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: self)),
              let end = calendar.date(byAdding: .day, value: 6, to: start) else { return self }
        return end
    }

    func day(calendar: Calendar = .gregorian) -> Int {
        calendar.component(.day, from: self)
    }

    func isInSameMonth(as other: Date, calendar: Calendar = .gregorian) -> Bool {
        calendar.isDate(self, equalTo: other, toGranularity: .month)
    }
}
