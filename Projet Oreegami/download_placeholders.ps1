$images = @(
    "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800",
    "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800",
    "https://images.unsplash.com/photo-1676299080923-6c98c0cf4e48?w=800",
    "https://images.unsplash.com/photo-1555255707-c07966088b7b?w=800",
    "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800",
    "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800",
    "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800",
    "https://images.unsplash.com/photo-1531297461136-82lw9b21d94b?w=800",
    "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800",
    "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=800",
    "https://images.unsplash.com/photo-1535378437327-b712818f6652?w=800",
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800",
    "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800",
    "https://images.unsplash.com/photo-1592478411213-61535fdd861d?w=800"
)

$i = 0
foreach ($url in $images) {
    $filename = "placeholder_$i.jpg"
    $path = "D:\Ai Quick Feed\ia-veille\Projet Oreegami\images\placeholders\$filename"
    try {
        Invoke-WebRequest -Uri $url -OutFile $path
        Write-Host "Downloaded $filename"
    } catch {
        Write-Error "Failed to download $url"
    }
    $i++
}
