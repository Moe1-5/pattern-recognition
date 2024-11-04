import dns.resolver

try:
    # Use only the hostname for the DNS query
    result = dns.resolver.resolve("coding-projects.tmed77f.mongodb.net", "SRV")
    for val in result:
        print("Resolved SRV:", val)
except dns.resolver.NXDOMAIN:
    print("Domain does not exist.")
except dns.resolver.Timeout:
    print("DNS query timed out.")
except dns.resolver.NoAnswer:
    print("No answer was returned.")
except Exception as e: 
    print("An error occurred:", e)
