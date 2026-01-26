import dns.resolver
from typing import Dict, List, Optional, Any

class DNSVerifier:
    """
    Utility to verify DNS records (SPF, DKIM, DMARC).
    """

    @staticmethod
    def get_txt_records(domain: str) -> List[str]:
        try:
            answers = dns.resolver.resolve(domain, 'TXT')
            return [r.to_text().strip('"') for r in answers]
        except (dns.resolver.NoAnswer, dns.resolver.NXDOMAIN):
            return []
        except Exception:
            return []

    @staticmethod
    def check_spf(domain: str) -> Dict[str, Any]:
        """
        Checks for SPF record.
        """
        records = DNSVerifier.get_txt_records(domain)
        spf_records = [r for r in records if r.startswith("v=spf1")]

        if not spf_records:
            return {"valid": False, "record": None, "message": "No SPF record found."}

        if len(spf_records) > 1:
            return {"valid": False, "record": spf_records, "message": "Multiple SPF records found (invalid)."}

        return {"valid": True, "record": spf_records[0], "message": "SPF record found."}

    @staticmethod
    def check_dmarc(domain: str) -> Dict[str, Any]:
        """
        Checks for DMARC record at _dmarc.domain.
        """
        dmarc_domain = f"_dmarc.{domain}"
        records = DNSVerifier.get_txt_records(dmarc_domain)
        dmarc_records = [r for r in records if r.startswith("v=DMARC1")]

        if not dmarc_records:
            return {"valid": False, "record": None, "message": "No DMARC record found."}

        return {"valid": True, "record": dmarc_records[0], "message": "DMARC record found."}

    @staticmethod
    def check_dkim(domain: str, selector: str) -> Dict[str, Any]:
        """
        Checks for DKIM record at selector._domainkey.domain.
        """
        dkim_domain = f"{selector}._domainkey.{domain}"
        records = DNSVerifier.get_txt_records(dkim_domain)
        dkim_records = [r for r in records if r.startswith("v=DKIM1")]

        # Sometimes DKIM records don't strictly start with v=DKIM1, just check if we got a TXT record at the selector
        if not records:
             return {"valid": False, "record": None, "message": "No DKIM record found at selector."}

        return {"valid": True, "record": records[0], "message": "DKIM record found."}
