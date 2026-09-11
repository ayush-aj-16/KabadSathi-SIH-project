import React from 'react';
import { RecyclerFacility, LanguageType, NetworkStatusType } from '../types';
import { Factory, Phone, MapPin, CheckCircle2, ShieldCheck, Clock, ExternalLink, Radio, AlertCircle } from 'lucide-react';

interface RecyclerDirectoryProps {
  recyclers: RecyclerFacility[];
  lastSyncedTimestamp: number;
  networkStatus: NetworkStatusType;
  language: LanguageType;
}

export const RecyclerDirectory: React.FC<RecyclerDirectoryProps> = ({
  recyclers,
  lastSyncedTimestamp,
  networkStatus,
  language,
}) => {
  const isHi = language === 'hi';
  const isOffline = networkStatus === 'offline';

  const formattedDate = new Date(lastSyncedTimestamp).toLocaleString(isHi ? 'hi-IN' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div id="recycler-directory-container" className="space-y-4">
      {/* Header with offline cached status indicator */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🏭</span>
              <h2 className="text-lg font-black text-slate-900">
                {isHi ? 'अधिकृत ई-कचरा रिसाइक्लर्स (Authorized Recyclers)' : 'Authorized E-Waste Dismantlers & Recyclers'}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isHi
                ? 'केंद्रीय प्रदूषण नियंत्रण बोर्ड (CPCB) द्वारा पंजीकृत सुरक्षित रिसाइक्लिंग केंद्र'
                : 'CPCB & State Pollution Control Board verified green recycling centers'}
            </p>
          </div>

          <span className="text-xs bg-teal-50 text-teal-800 font-bold px-3 py-1.5 rounded-xl border border-teal-200 self-start sm:self-center">
            🛡️ {isHi ? '100% कानूनी व सुरक्षित' : 'Formal Recyclers Only'}
          </span>
        </div>

        {/* REQUIREMENT 7: OFFLINE RECYCLER STATUS */}
        {isOffline ? (
          <div id="offline-recycler-box" className="mt-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 space-y-1">
            <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
              <Radio className="w-4 h-4 text-slate-600" />
              <span>📡 {isHi ? `अंतिम अपडेट: ${formattedDate}` : `Last updated: ${formattedDate}`}</span>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              {isHi
                ? 'ऑफलाइन मोड: रिसाइक्लर के पते और फोन नंबर आपके फोन में सुरक्षित हैं। लाइव गेट वेटिंग टाइम और डॉक स्थिति के लिए इंटरनेट की आवश्यकता होगी।'
                : 'Offline directory loaded from local storage. Facility contact and location details are cached, but live gate status requires active network.'}
            </p>
          </div>
        ) : (
          <div id="online-recycler-box" className="mt-4 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-semibold">
                🟢 {isHi ? 'लाइव रिसाइक्लर डायरेक्टरी सक्रिय' : 'Live Recycler Directory Active'}
              </span>
            </div>
            <span className="text-emerald-700 font-mono text-[11px]">
              📡 {isHi ? `अपडेट: ${formattedDate}` : `Updated: ${formattedDate}`}
            </span>
          </div>
        )}
      </div>

      {/* Recycler Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recyclers.map((facility) => (
          <div
            key={facility.id}
            id={`facility-card-${facility.id}`}
            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-600" />
                  <span>{facility.verificationBadge}</span>
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  📍 {facility.distanceKm} km away
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {facility.name}
              </h3>

              <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                  <span className="line-clamp-2">{facility.address}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span className="font-medium text-slate-800">{facility.phone}</span>
                </div>
              </div>

              {/* Accepted Materials Chips */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isHi ? 'स्वीकृत सामग्री:' : 'Accepted Scrap:'}
                </span>
                <div className="flex flex-wrap gap-1">
                  {facility.acceptedMaterials.map((mat, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded-md"
                    >
                      {mat}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-2">
              <a
                href={`tel:${facility.phone}`}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 px-3 rounded-xl text-center flex items-center justify-center gap-1.5 transition"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>{isHi ? 'कॉल करें' : 'Call Hub'}</span>
              </a>

              <button
                type="button"
                onClick={() => alert(`Location: ${facility.address}`)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold py-2 px-3 rounded-xl flex items-center gap-1 transition"
              >
                <span>{isHi ? 'दिशा देखें' : 'Map View'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
